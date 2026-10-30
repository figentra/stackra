/**
 * Stackra file contract:
 * Purpose: Vite config of @figentra/playground: React, Tailwind v4, the workspace packages read as source (the
 *          `@stackra/source` condition, ADR 0025) and one copy of React and HeroUI. React Aria needs no dedupe: pnpm
 *          links @stackra/ui's and HeroUI's react-aria-components to one directory (catalog:frontend pins HeroUI's
 *          version), so the provider's I18nProvider and HeroUI share one context. Imports use the `#` aliases of
 *          package.json, never an `@/` alias (ADR 0233).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0165 (web client stack); ADR 0025 (source condition).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig } from "vite";

import { llmsTxtPlugin } from "./scripts/llms-txt.plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), llmsTxtPlugin()],
  resolve: {
    conditions: ["@stackra/source", ...defaultClientConditions],
    dedupe: ["react", "react-dom", "@heroui/react"],
  },
});
