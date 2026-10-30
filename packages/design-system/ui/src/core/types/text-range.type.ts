/**
 * Stackra file contract:
 * Purpose: `TextRange`, a span of a string by UTF-16 offsets: `start` included, `end` excluded.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** A span of a string. */
export interface TextRange {
  readonly start: number;
  readonly end: number;
}
