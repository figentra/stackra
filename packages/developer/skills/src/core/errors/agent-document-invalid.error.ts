/**
 * Stackra file contract:
 * Purpose: `AgentDocumentInvalidError`, thrown when an agent document cannot be parsed or breaks its kind's
 *          frontmatter schema: names the source file and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad document is an author's mistake found by the loader, the renderers
 *           or `stackra agents check` before anything is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0282 (decision 2 and enforcement).
 */
import type { DocumentIssue } from "#core/types/document-issue.type";

/**
 * An agent document that fails to parse.
 *
 * @example
 * try {
 *   parseAgentDocument("rule", text, "rules/naming.md");
 * } catch (error) {
 *   if (error instanceof AgentDocumentInvalidError) error.issues; // [{ path: "title", message: "…" }]
 * }
 */
export class AgentDocumentInvalidError extends Error {
  /** The file path the document came from, as given. */
  readonly source: string;

  /** Every invalid value, in document order. */
  readonly issues: readonly DocumentIssue[];

  /**
   * @param source - the file path of the document.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly DocumentIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "AgentDocumentInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
