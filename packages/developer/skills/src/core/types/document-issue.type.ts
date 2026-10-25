/**
 * Stackra file contract:
 * Purpose: `DocumentIssue`, one reason an agent document is invalid: the frontmatter key (or `name`, or empty for the
 *          whole document) and a message.
 * Boundary: type only; `AgentDocumentInvalidError` carries a list of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2).
 */

/** One invalid value. */
export type DocumentIssue = {
  /** Dotted frontmatter path (`globs.0`), `name` for the derived name, or empty for the whole document. */
  readonly path: string;
  /** What is wrong. */
  readonly message: string;
};
