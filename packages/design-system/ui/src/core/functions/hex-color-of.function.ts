/**
 * Stackra file contract:
 * Purpose: `hexColorOf(text)`, a typed colour as `#rrggbb` (lower case, `#rgb` expanded, the hash optional), or
 *          `null` when it is not a hex colour.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */

/**
 * The colour typed, as `#rrggbb`.
 * @param text - what was typed
 * @returns the colour, or `null`
 */
export function hexColorOf(text: string): string | null {
  const bare = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(bare)) return `#${[...bare].map((c) => c + c).join("")}`;
  return /^[0-9a-f]{6}$/.test(bare) ? `#${bare}` : null;
}
