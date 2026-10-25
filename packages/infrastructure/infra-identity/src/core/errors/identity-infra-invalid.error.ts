/**
 * Stackra file contract:
 * Purpose: `IdentityInfraInvalidError`, thrown when the seed or the root runway cannot give an identity plan: names
 *          the source and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad seed or runway is an operator's mistake found by `stackra infra gen`
 *           or `pulumi preview` before anything changes. The seed holds names, URIs and colours, never a secret value,
 *           so the issues may quote them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement), ADR 0171 (decisions 3 and 4), ADR 0325 (rule 1: a deploy checks its
 *                     inputs before it starts).
 */
import type { RunwayIssue } from "@stackra/runway";

/**
 * A seed or an identity plan that fails a check.
 *
 * @example
 * try {
 *   identityPlan(root, seed, "prod");
 * } catch (error) {
 *   if (error instanceof IdentityInfraInvalidError) error.issues; // [{ path: "seed.apps.console.redirectUris…", … }]
 * }
 */
export class IdentityInfraInvalidError extends Error {
  /** Where the facts came from: the seed file, or the seed and the root runway. */
  readonly source: string;

  /** Every invalid value, in check order. */
  readonly issues: readonly RunwayIssue[];

  /**
   * @param source - where the facts came from.
   * @param issues - the invalid values.
   */
  constructor(source: string, issues: readonly RunwayIssue[]) {
    super(
      `${source} is invalid: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")}`,
    );
    this.name = "IdentityInfraInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
