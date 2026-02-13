import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve("extension", "app", "dist");
const src = resolve("extension", "app", "public", "manifest.firefox.json");
const dest = resolve(distDir, "manifest.json");

await copyFile(src, dest);
console.log("Firefox manifest copied to", dest);
