import { copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// First, convert ES modules to IIFE for MV2 compatibility
console.log("Converting ES modules to IIFE...");
await execAsync("node extension/app/scripts/convert-to-iife.mjs");

const distDir = resolve("extension", "app", "dist");
const manifestSrc = resolve("extension", "app", "public", "manifest.firefox.json");
const manifestDest = resolve(distDir, "manifest.json");

// Find the browser-polyfill chunk file
const scriptsDir = join(distDir, "scripts");
const files = await readdir(scriptsDir);
const polyfillChunk = files.find((f) => f.startsWith("browser-polyfill-") && f.endsWith(".js"));

if (!polyfillChunk) {
  console.warn("⚠️  Browser polyfill chunk not found. Background script may not work in Firefox MV2.");
}

// Read and modify the manifest to include the polyfill chunk before background
const manifest = JSON.parse(await readFile(manifestSrc, "utf-8"));

if (polyfillChunk && manifest.background && manifest.background.scripts) {
  // Insert polyfill before background script
  const bgScripts = manifest.background.scripts;
  const polyfillPath = `scripts/${polyfillChunk}`;
  
  // Remove polyfill if it already exists and add it at the beginning
  manifest.background.scripts = [
    polyfillPath,
    ...bgScripts.filter((s) => !s.includes("browser-polyfill")),
  ];
  
  console.log(`✓ Added polyfill chunk: ${polyfillPath}`);
}

// Write the modified manifest
await writeFile(manifestDest, JSON.stringify(manifest, null, 2));
console.log("✓ Firefox manifest copied to", manifestDest);

// Also update popup HTML to load scripts in correct order (polyfill first)
if (polyfillChunk) {
  const popupHtmlPath = join(distDir, "src", "popup", "popup.html");
  let popupHtml = await readFile(popupHtmlPath, "utf-8");
  
  // Check if already modified
  if (!popupHtml.includes(`scripts/${polyfillChunk}`)) {
    // Ensure polyfill is loaded before popup.js
    const polyfillScript = `  <script src="/scripts/${polyfillChunk}"></script>\n  <script src="/scripts/utils.js"></script>`;
    
    // Replace the popup.js script tag to load polyfill first, and defer popup execution
    popupHtml = popupHtml.replace(
      /<script[^>]*src="\/scripts\/popup\.js"[^>]*><\/script>/,
      `${polyfillScript}\n  <script defer src="/scripts/popup.js"></script>`
    );
    
    await writeFile(popupHtmlPath, popupHtml);
    console.log("✓ Updated popup.html to load scripts in correct order");
  } else {
    console.log("✓ popup.html already configured");
  }
}
