/**
 * Stackra file contract:
 * Purpose: `TextFile`, a repository file and its text, as a phase runner hands it to a pure check.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); STA-2851.
 */

/** A repository file read by a phase runner. */
export type TextFile = {
  /** The repository-relative path, with forward slashes. */
  readonly path: string;

  /** The file's text. */
  readonly text: string;
};
