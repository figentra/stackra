/**
 * Stackra file contract:
 * Purpose: `tierAndSlug`, the tier and slug a route folder names: `pro-kanban` is `pro/kanban`, `button` is `free/button`.
 * Boundary: a pure function of the shrink-routes codemod.
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2 (web path = `/<slug>` or `/pro-<slug>`).
 */

/** The tier and slug of a route folder. */
export function tierAndSlug(folder: string): {
  readonly tier: "free" | "pro";
  readonly slug: string;
} {
  return folder.startsWith("pro-")
    ? { tier: "pro", slug: folder.slice("pro-".length) }
    : { tier: "free", slug: folder };
}
