/**
 * Stackra file contract:
 * Purpose: `GithubInfraInvalidError`, thrown when the root runway cannot give a GitHub plan, or when a committed
 *          ruleset or branch protection file breaks its shape or holds a setting the Pulumi GitHub provider cannot
 *          apply: names the source and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad runway or rules file is an operator's mistake found by `stackra
 *           infra gen` or `pulumi preview` before anything changes on GitHub. The facts are names and ids, never
 *           secret values, so the issues may quote them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement), ADR 0171 (decision 8: rulesets through the Pulumi GitHub provider),
 *                     ADR 0325 (rule 1: a deploy checks its inputs before it starts).
 */
import type { RunwayIssue } from "@stackra/runway";

/**
 * A GitHub plan, ruleset or branch protection file that fails a check.
 *
 * @example
 * try {
 *   githubPlan(root);
 * } catch (error) {
 *   if (error instanceof GithubInfraInvalidError) error.issues; // [{ path: "root.providers.github.repo", … }]
 * }
 */
export class GithubInfraInvalidError extends Error {
  /** Where the facts came from: the root runway, or the path of a rules file. */
  readonly source: string;

  /** Every invalid value, in check order. */
  readonly issues: readonly RunwayIssue[];

  /**
   * @param source - where the facts came from.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly RunwayIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path || "(document)"}: ${issue.message}`).join("; ")}`,
    );
    this.name = "GithubInfraInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
