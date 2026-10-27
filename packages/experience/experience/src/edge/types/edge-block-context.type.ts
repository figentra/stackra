/**
 * Stackra file contract:
 * Purpose: `EdgeBlockContext`, what an edge block's `html` is told besides its props and children: the visitor's
 *          locale and where the node sits in the document.
 * Boundary: a type only; no request, header or visitor data reaches an edge block.
 * Runtime: isomorphic
 * Governing contract: ADR 0440.
 */

/** Where the block sits and the visitor's locale. */
export interface EdgeBlockContext {
  /** The visitor's locale, already applied to every `LocalizedText` prop. */
  readonly locale: string;

  /** Where the node sits (`0.children.2`). */
  readonly path: string;
}
