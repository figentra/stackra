/**
 * Stackra file contract:
 * Purpose: `llmsTxtPlugin`, the Vite plugin that writes `llms.txt` (llmstxt.org) into the playground build: every built
 *          component per category, a link to its page with its English description and doc-page headline, from
 *          @stackra/showcase's `llmsTxt` over the registry and the English catalogue.
 * Boundary: build only (`generateBundle`); links are relative to `PLAYGROUND_URL` when set, the site root otherwise.
 * Runtime: node
 * Governing contract: STA-1371 (doc pages wave: llms.txt, 2026-10-28).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import type { Plugin } from "vite";

/** Writes `llms.txt` beside `index.html`. */
export function llmsTxtPlugin(): Plugin {
  return {
    name: "stackra-llms-txt",
    apply: "build",
    async generateBundle() {
      // shortcut: reads the showcase's built entry at config time (node, no `@stackra/source` condition); when the
      // package is not built yet the file is skipped with a warning instead of failing the playground build.
      try {
        const { COMPONENTS, llmsTxt } = await import("@stackra/showcase");
        const require = createRequire(import.meta.url);
        const catalogue: unknown = JSON.parse(
          readFileSync(require.resolve("@stackra/showcase/assets/lang/en/showcase.json"), "utf8"),
        );
        this.emitFile({
          type: "asset",
          fileName: "llms.txt",
          source: llmsTxt({
            entries: COMPONENTS,
            catalogue,
            baseUrl: process.env["PLAYGROUND_URL"] ?? "",
            title: "Stackra UI",
            summary:
              "The Stackra design system: accessible, bilingual (English and Arabic) React and React Native components on HeroUI, with one API on web and mobile.",
          }),
        });
      } catch (error) {
        this.warn(`llms.txt skipped: ${String(error)}`);
      }
    },
  };
}
