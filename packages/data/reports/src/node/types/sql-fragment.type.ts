/**
 * Stackra file contract:
 * Purpose: `SqlFragment`, a piece of a report statement: SQL text with `?` placeholders and the values bound to them.
 * Boundary: a type only. The text is built from the generated metadata and the closed report vocabulary; every value a
 *           caller sends is a bound parameter, never text (ADR 0160).
 * Runtime: node
 * Governing contract: ADR 0160 (parameterised SQL); ADR 0470 (decision 3).
 */

/** SQL text and its bound values. */
export interface SqlFragment {
  /** The text, with one `?` per value. */
  readonly sql: string;

  /** The bound values, in placeholder order. */
  readonly params: readonly unknown[];
}
