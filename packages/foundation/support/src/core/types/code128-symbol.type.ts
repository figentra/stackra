/**
 * Stackra file contract:
 * Purpose: `Code128Symbol`, what `code128` returns: the symbol values (start, data, check, stop) and the module widths a
 *          renderer draws, bars and spaces alternating from a bar.
 * Boundary: a type only. The quiet zones (10 modules each side) and the human-readable line are the renderer's.
 * Runtime: isomorphic
 * Governing contract: ISO/IEC 15417; ADR 0305.
 */

/** An encoded Code 128 symbol. */
export interface Code128Symbol {
  /** The symbol values in order: a start, the data, the check value, the stop (106). */
  readonly values: readonly number[];

  /** The module widths, one digit per bar or space, starting with a bar and ending with the stop's final bar. */
  readonly widths: string;
}
