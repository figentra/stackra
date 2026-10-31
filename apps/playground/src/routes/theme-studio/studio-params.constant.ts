/**
 * Stackra file contract:
 * Purpose: `STUDIO_PARAMS`: the search params the studio's knobs live in; the scheme and locale params are the shell's.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio: a link opens the same theme).
 */

/** The search params the knobs live in. */
export const STUDIO_PARAMS = [
  "name",
  "accent",
  "hue",
  "tint",
  "radius",
  "font",
  "arabic",
  "display",
  "display-ar",
  "blur",
  "density",
  "pill",
  "field",
  "corner",
  "tint",
  "vibrant",
  "fscale",
  "lh",
  "ls",
  "forms",
  "shadows",
  "fbw",
  "dop",
  "cursor",
  "skel",
  "anim",
  // A copied link's brand: read once on load, then dropped by the next change (the brand lives in storage).
  "brand",
] as const;
