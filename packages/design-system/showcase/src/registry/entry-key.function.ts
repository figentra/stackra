/**
 * Stackra file contract:
 * Purpose: `entryKey`, the registry key of an entry: `<tier>/<slug>`.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentEntry } from "#src/types/component-entry.type";

/** The key of `entry`, such as "free/button" or "pro/kanban". */
export function entryKey(entry: Pick<ComponentEntry, "tier" | "slug">): string {
  return `${entry.tier}/${entry.slug}`;
}
