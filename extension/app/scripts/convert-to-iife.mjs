import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const scriptsDir = "extension/app/dist/scripts";
const htmlPath = "extension/app/dist/src/popup/popup.html";

// Find the polyfill chunk
const files = await readdir(scriptsDir);
const polyfillFile = files.find((f) => f.startsWith("browser-polyfill-") && f.endsWith(".js"));

if (!polyfillFile) {
  console.error("❌ Polyfill chunk not found!");
  process.exit(1);
}

// Read all script files
const polyfillPath = join(scriptsDir, polyfillFile);
const backgroundPath = join(scriptsDir, "background.js");
const popupPath = join(scriptsDir, "popup.js");
const utilsPath = join(scriptsDir, "utils.js");

let polyfillCode = await readFile(polyfillPath, "utf-8");
let backgroundCode = await readFile(backgroundPath, "utf-8");
let popupCode = await readFile(popupPath, "utf-8");
let utilsCode = await readFile(utilsPath, "utf-8");

// Check if already converted
if (polyfillCode.trim().startsWith("(function()")) {
  console.log("✓ Scripts already converted to IIFE, skipping");
  process.exit(0);
}

// Extract what's being exported from polyfill (e.g., export{U as b})
// Handle minified code with newlines between tokens
const exportMatch = polyfillCode.match(/export\s*\{\s*(\w+)\s+as\s+\w+\s*\}/s);
const exportedVar = exportMatch ? exportMatch[1] : null;

if (!exportedVar) {
  console.error("❌ Could not detect exported variable from polyfill");
  console.error("Polyfill tail:", polyfillCode.slice(-200));
  process.exit(1);
}

console.log(`  Detected exported variable: ${exportedVar}`);

// Remove export statements from polyfill
polyfillCode = polyfillCode
  .replace(/export\s*\{[^}]+\}\s*;?/g, "");

// Wrap polyfill to expose as global
polyfillCode = `
(function() {
  'use strict';
  ${polyfillCode}
  // Expose browser API as global
  const browserAPI = ${exportedVar};
  if (typeof globalThis !== 'undefined') {
    globalThis.browser = browserAPI;
  }
  if (typeof window !== 'undefined') {
    window.browser = browserAPI;
  }
  if (typeof self !== 'undefined') {
    self.browser = browserAPI;
  }
})();
`;

// Function to extract the imported identifier and replace with window.browser
function replaceImportWithGlobal(code) {
  // Match: import{b as N}from"./browser-polyfill-XXX.js";
  const importMatch = code.match(/import\s*\{[^}]*\s+as\s+(\w+)\s*\}\s*from\s*["'][^"']*browser-polyfill[^"']*["']\s*;?/);
  const localVar = importMatch ? importMatch[1] : null;
  
  if (!localVar) {
    console.warn("⚠ Could not detect browser import in this file, using default 'browser'");
  }
  
  // Remove all import statements
  code = code
    .replace(/^import\s*\{[^}]+\}\s*from\s*["'][^"']+["']\s*;?/gm, "")
    .replace(/^import\s+[^;]+;?/gm, "")
    // Remove inline imports from minified code
    .replace(/import\s*\(\s*["'][^"']+["']\s*\)/g, "Promise.resolve({})")
    .replace(/import\s*["'][^"']+["']\s*;?/g, "");
  
  return { code, localVar: localVar || 'browser' };
}

// Process background.js
let bgResult = replaceImportWithGlobal(backgroundCode);
backgroundCode = `
(function() {
  'use strict';
  const ${bgResult.localVar} = (typeof window !== 'undefined' && window.browser) || (typeof browser !== 'undefined' && browser) || null;
  if (!${bgResult.localVar}) {
    console.error('Browser API not available in background');
    return;
  }
  ${bgResult.code}
})();
`;

// Process popup.js
let popupResult = replaceImportWithGlobal(popupCode);
console.log(`  Detected popup.js browser variable: ${popupResult.localVar}`);
popupCode = `
(function() {
  'use strict';
  const ${popupResult.localVar} = (typeof window !== 'undefined' && window.browser) || null;
  if (!${popupResult.localVar}) {
    console.error('Browser API not available in popup');
    return;
  }
  ${popupResult.code}
})();
`;

// Process utils.js
let utilsResult = replaceImportWithGlobal(utilsCode);
console.log(`  Detected utils.js browser variable: ${utilsResult.localVar}`);
utilsCode = `
(function() {
  'use strict';
  const ${utilsResult.localVar} = (typeof window !== 'undefined' && window.browser) || null;
  if (!${utilsResult.localVar}) {
    console.error('Browser API not available in utils');
    return;
  }
  ${utilsResult.code}
})();
`;

// Write back all scripts
await writeFile(polyfillPath, polyfillCode);
await writeFile(backgroundPath, backgroundCode);
await writeFile(popupPath, popupCode);
await writeFile(utilsPath, utilsCode);

// Fix popup HTML - remove type="module" and modulepreload
let htmlContent = await readFile(htmlPath, "utf-8");
htmlContent = htmlContent
  .replace(/<script type="module"/g, '<script')
  .replace(/<link rel="modulepreload"[^>]*>/g, '')
  .replace(/crossorigin /g, '');

await writeFile(htmlPath, htmlContent);

console.log("✓ Converted ES modules to IIFE for Firefox MV2");
console.log(`  - ${polyfillFile}`);
console.log(`  - background.js`);
console.log(`  - popup.js`);
console.log(`  - utils.js`);
console.log(`  - popup.html (removed type="module")`);
