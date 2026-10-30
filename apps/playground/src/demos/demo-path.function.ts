/**
 * Stackra file contract:
 * Purpose: `demoPath`, the `DEMOS` key of one example of an entry: `./<tier>/<slug>/<id>.tsx`.
 * Boundary: a pure function.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { ComponentEntry } from "@stackra/showcase";

/** The glob key of the demo `id` of `entry`. */
export function demoPath(entry: Pick<ComponentEntry, "tier" | "slug">, id: string): string {
  return `./${entry.tier}/${entry.slug}/${id}.tsx`;
}
