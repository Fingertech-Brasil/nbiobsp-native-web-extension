import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/postcss";
import { resolve } from "path";

export default defineConfig({
  cacheDir: resolve(__dirname, "node_modules/.vite"),
  plugins: [preact()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  root: __dirname,
  server: {
    fs: {
      // allow importing from sibling workspace (../shared)
      allow: [__dirname, resolve(__dirname, "..", "shared")],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
      },
    },
    minify: "esbuild",
    sourcemap: false,
  },
});
