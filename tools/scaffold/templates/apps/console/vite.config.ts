/**
 * Stackra file contract:
 * Purpose: Vite config of @figentra/{{NAME}}: React, Tailwind v4 and one copy of React and HeroUI. Imports use the
 *          `#` aliases of package.json, never an `@/` alias (ADR 0233).
 * Boundary: build configuration only; a tool config gen will write into `.stackra/` (ADR 0295 decision 5).
 * Runtime: node
 * Governing contract: ADR 0295 (decision 5); ADR 0165 (web client stack).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { dedupe: ["react", "react-dom", "@heroui/react"] },
});
