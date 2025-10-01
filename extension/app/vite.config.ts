import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/postcss";
import { resolve } from "path";

export default defineConfig({
  plugins: [preact()],
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  publicDir: "public", // Copy static files (e.g., manifest.json, icons) to dist
  build: {
    outDir: "dist", // Output directory for the extension
    emptyOutDir: true, // Clear output directory before building
    rollupOptions: {
      input: {
        // HTML entry points
        popup: resolve(__dirname, "src/popup/popup.html"),
        // Non-HTML entry points (content and background scripts)
        utils: resolve(__dirname, "src/utils.ts"),
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
    sourcemap: false, // Disable source maps for production
  },
});
