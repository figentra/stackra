/**
 * Stackra file contract:
 * Purpose: `RunwayIssue`, one reason a runway document or facts file is invalid: the dotted path inside the document
 *          and a message.
 * Boundary: type only; `RunwayInvalidError` carries a list of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement: `stackra validate` names each failure).
 */

/** One invalid value. */
export type RunwayIssue = {
  /** Dotted path inside the document (`environments.dev.port`); empty for the whole document. */
  readonly path: string;
  /** What is wrong. */
  readonly message: string;
};
