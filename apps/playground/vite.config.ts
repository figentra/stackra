/**
 * Stackra file contract:
 * Purpose: Vite config of @figentra/playground: React, Tailwind v4, the workspace packages read as source (the
 *          `@stackra/source` condition, ADR 0025) and one copy of React and HeroUI. React Aria needs no dedupe: pnpm
 *          links @stackra/ui's and HeroUI's react-aria-components to one directory (catalog:frontend pins HeroUI's
 *          version), so the provider's I18nProvider and HeroUI share one context. Imports use the `#` aliases of
 *          package.json, never an `@/` alias (ADR 0233). For dev speed the app's catalogues are one module
 *          (`cataloguesPlugin`) and the shell and component page are transformed while the server starts (warmup).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0165 (web client stack); ADR 0025 (source condition).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

import { cataloguesPlugin } from "./scripts/catalogues.plugin";
import { llmsTxtPlugin } from "./scripts/llms-txt.plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cataloguesPlugin(), llmsTxtPlugin()],
  resolve: {
    conditions: ["@stackra/source", ...defaultClientConditions],
    dedupe: ["react", "react-dom", "@heroui/react"],
  },
  server: {
    // Transformed while the server starts, so the first page load does not wait for the shell and the component page
    // (and every workspace module they import) to be transformed one request at a time.
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/components/component-page/index.ts"],
    },
  },
});
