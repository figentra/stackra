/**
 * Stackra file contract:
 * Purpose: `CodeContractProps`, the props every runtime's `Code` takes: a short piece of code inside a sentence (a
 *          command, a key, a file name) in the monospaced face on a soft fill.
 * Boundary: types only. Inline only; a block of code is CodeBlock. The text always reads left to right.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap build, owner approval 2026-10-31).
 */

/** Props shared by the web and native `Code`. */
export interface CodeContractProps {
  /** The code, as text. */
  readonly children: string;
}
