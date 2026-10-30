/**
 * Stackra file contract:
 * Purpose: `pxOf`: a CSS length in px (`0.25rem` is 4, `2px` is 2), so the radius slider starts at the theme's.
 * Boundary: pure; a rem is taken as 16px; anything else (a variable, a percentage) gives undefined.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */

/** `length` in px, or undefined when it is not a px or rem length. */
export function pxOf(length: string): number | undefined {
  const match = /^([\d.]+)(px|rem)$/.exec(length.trim());
  if (!match) return undefined;
  return Number(match[1]) * (match[2] === "rem" ? 16 : 1);
}
