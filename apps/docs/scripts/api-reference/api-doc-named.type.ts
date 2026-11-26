/**
 * Stackra file contract:
 * Purpose: `ApiDocNamed`, one named TSDoc block (`@param name - text`, `@typeParam T - text`).
 * Boundary: data only; `parseDocComment` fills it.
 * Runtime: node
 * Governing contract: ADR 0007 (docblock standard); STA-2857.
 */

/** One named TSDoc block such as `@param name - text` or `@typeParam T - text`. */
export interface ApiDocNamed {
  /** The parameter or type parameter name, as written after the tag. */
  readonly name: string;
  /** The text after the name, with the leading `-` removed; empty when the tag has none. */
  readonly text: string;
}
