/**
 * Stackra file contract:
 * Purpose: `ExtractedText`, what a `TextExtractor` reads out of a document or an image: the text in reading order and
 *          the languages it found.
 * Boundary: a type only. Right-to-left text (Arabic) is kept in logical order, never visual order, so search and the
 *           agent read it as written.
 * Runtime: isomorphic
 * Governing contract: ADR 0222; ADR 0192 (Arabic defaults); OS-150.
 */

/** The text of one file. */
export interface ExtractedText {
  /** The text, in logical reading order. */
  readonly text: string;

  /** The BCP 47 languages found (`ar`, `en`). */
  readonly languages: readonly string[];
}
