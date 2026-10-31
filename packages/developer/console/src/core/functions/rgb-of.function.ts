/**
 * Stackra file contract:
 * Purpose: `rgbOf(hex)`, the red, green and blue channels (0 to 255) of a `#rrggbb` colour.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017 and FR-020.
 */

/** `#rrggbb` → [r, g, b]. */
export function rgbOf(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace(/^#/, ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
