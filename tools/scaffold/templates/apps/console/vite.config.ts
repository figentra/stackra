/**
 * Stackra file contract:
 * Purpose: Vite config of @figentra/{{NAME}} — React, Tailwind v4, the `@/` alias to src and one copy of React and
 *          HeroUI.
 * Owner: the app owner · Secrets: forbidden
 */
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "@heroui/react"],
  },
});
