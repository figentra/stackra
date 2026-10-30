/**
 * Stackra file contract:
 * Purpose: `DOC_FIELDS`, the hero, pillar and RTL fields every entry's doc page carries.
 * Boundary: a constant only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */

/** The hero, pillar and RTL fields every entry carries. */
export const DOC_FIELDS = ["headline", "intro", "tags", "what", "when", "rtl"] as const;
