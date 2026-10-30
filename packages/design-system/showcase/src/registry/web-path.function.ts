/**
 * Stackra file contract:
 * Purpose: `webPath`, the playground URL of an entry: `/<slug>` for free, `/pro-<slug>` for Pro (today's URLs, unchanged).
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The web path of `entry`: "/button", "/pro-kanban". */
export function webPath(entry: Pick<ComponentEntry, "tier" | "slug">): string {
  return entry.tier === "pro" ? `/pro-${entry.slug}` : `/${entry.slug}`;
}
