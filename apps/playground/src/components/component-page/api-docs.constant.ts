/**
 * Stackra file contract:
 * Purpose: `API_DOCS`, the lazy loaders of the generated API docs by `<platform>/<tier>/<slug>`, one JSON per entry
 *          and platform, so a page loads only its own.
 * Boundary: the glob map only; `useApiDoc` reads it. The glob reaches the showcase package by path because Vite's
 *           glob takes no bare package specifier; the files are `@stackra/showcase/api/*` (WP2 output).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 and 7.1.
 */
import type { ApiDoc } from "@stackra/showcase";

const FILES = import.meta.glob<ApiDoc>(
  "../../../../../packages/design-system/showcase/api/*/*/*.json",
  { import: "default" },
);

const KEY = /\/(react|native)\/([^/]+)\/([^/]+)\.json$/;

/** The loader of each generated ApiDoc, keyed `react/free/button`. */
export const API_DOCS: Readonly<Record<string, () => Promise<ApiDoc>>> = (() => {
  const out: Record<string, () => Promise<ApiDoc>> = {};
  for (const [file, load] of Object.entries(FILES)) {
    const match = KEY.exec(file);
    if (match) out[`${match[1]}/${match[2]}/${match[3]}`] = load;
  }
  return out;
})();
