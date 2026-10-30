/**
 * Stackra file contract:
 * Purpose: `faceOf`: the first family of a CSS `font-family` list, unquoted (`"Geist", sans-serif` is `Geist`).
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */

/** The first family named in `stack`. */
export function faceOf(stack: string): string {
  return (stack.split(",")[0] ?? "").replaceAll(/["']/g, "").trim();
}
