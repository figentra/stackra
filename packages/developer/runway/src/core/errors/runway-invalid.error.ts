/**
 * Stackra file contract:
 * Purpose: `RunwayInvalidError`, thrown when a runway file or a runway facts document breaks its schema: names the
 *          source (a file path or a description) and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad runway is an operator's mistake found by `stackra validate`, gen or
 *           a dev tool before anything serves. A runway holds no secret value, so the issues may quote paths freely.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement), ADR 0294 (decision 19: config is checked before serving).
 */
import type { RunwayIssue } from "#core/types/runway-issue.type";

/**
 * A runway document that fails its schema.
 *
 * @example
 * try {
 *   parseRunway("service", document, "services/commerce/runway.yaml");
 * } catch (error) {
 *   if (error instanceof RunwayInvalidError) error.issues; // [{ path: "requires.cache.reason", message: "…" }]
 * }
 */
export class RunwayInvalidError extends Error {
  /** The file path, or a description of where the document came from. */
  readonly source: string;

  /** Every invalid value, in document order. */
  readonly issues: readonly RunwayIssue[];

  /**
   * @param source - the file path or a description of the document.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly RunwayIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "RunwayInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
