import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [preact()],
  publicDir: "public", // Copy static files (e.g., manifest.json, icons) to dist
  build: {
    outDir: "dist", // Output directory for the extension
    emptyOutDir: true, // Clear output directory before building
    rollupOptions: {
      input: {
        // HTML entry points
        popup: resolve(__dirname, "src/popup/popup.html"),
        // Non-HTML entry points (content and background scripts)
        content: resolve(__dirname, "src/content/content.ts"),
        background: resolve(__dirname, "src/background/background.ts"),
      },
      output: {
        // Customize output file names
        entryFileNames: "scripts/[name].js", // e.g., popup.js, content.js
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
    // Optimize for production
    minify: "esbuild", // Minify to reduce bundle size
    sourcemap: true, // Enable source maps for debugging
  },
});
