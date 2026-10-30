/**
 * Stackra file contract:
 * Purpose: `DEMOS`, the one `import.meta.glob` over the web demos: every `demos/<tier>/<slug>/<id>.tsx` as a lazy
 *          module (the live preview) and as its raw source (the code shown), so the same file is both (HeroUI's rule).
 * Boundary: the glob maps only; a component page picks a demo by `demoPath(entry, id)`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { ComponentType } from "react";

/** The web demos: lazy modules and lazy raw sources, keyed by `./<tier>/<slug>/<id>.tsx`. */
export const DEMOS = {
  modules: import.meta.glob<{ readonly default: ComponentType }>("./*/*/*.tsx"),
  sources: import.meta.glob<string>("./*/*/*.tsx", { query: "?raw", import: "default" }),
} as const;
