/**
 * Stackra file contract:
 * Purpose: `AnchorIR`, one anchor key found in the member's source with its place: a declaration (`anchor="..."` on a
 *          component) or a reference (`anchor: "..."` in a tour step or an answer).
 * Boundary: a type only; discovery's `readAnchors` produces it. `clientToolsOf` refuses a reference whose key no
 *           declaration (the member's, or a dependency manifest's `ui.anchors`) names (`anchor_undeclared`).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 1: an anchor is a declaration; decision 10: a tour references only declared
 *                     anchors); STA-1631.
 */

/** An anchor key at a place in the source. */
export interface AnchorIR {
  /** The source file, relative to the member root. */
  readonly file: string;

  /** The 1-based line. */
  readonly line: number;

  /** The 1-based column. */
  readonly column: number;

  /** The anchor key. */
  readonly key: string;
}
