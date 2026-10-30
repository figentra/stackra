/**
 * Stackra file contract:
 * Purpose: `CodeBlockProps`: props of `CodeBlock`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link CodeBlock}. */
export interface CodeBlockProps {
  /** The source to show, newline-separated; it is never translated and always reads left to right. */
  readonly code: string;
}
