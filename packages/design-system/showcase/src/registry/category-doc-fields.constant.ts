/**
 * Stackra file contract:
 * Purpose: `CATEGORY_DOC_FIELDS`, the hero and pillar fields of a category page.
 * Boundary: a constant only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */

/** The hero and pillar fields of a category page. */
export const CATEGORY_DOC_FIELDS = [
  "eyebrow",
  "headline",
  "intro",
  "tags",
  "what",
  "when",
  "how",
] as const;
