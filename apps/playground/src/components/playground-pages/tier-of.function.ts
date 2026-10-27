/**
 * Stackra file contract:
 * Purpose: `tierOf`: the tier of the page at `path`: Pro when it starts with `/pro-`, else Free.
 * Boundary: a pure function, in its own file; the tier is derived from the path, never declared on a route.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0305 (rule 10).
 */
import type { PageTier } from "./page-tier";

/** The tier of the page at `path`: Pro when it starts with `/pro-`, else Free. */
export function tierOf(path: string): PageTier {
  return path.startsWith("/pro-") ? "Pro" : "Free";
}
