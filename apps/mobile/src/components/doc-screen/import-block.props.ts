/**
 * Stackra file contract:
 * Purpose: `ImportBlockProps`: props of `ImportBlock`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link ImportBlock}. */
export interface ImportBlockProps {
  /** The import line, from `importLine(entry, "native")`. */
  readonly line: string;
}
