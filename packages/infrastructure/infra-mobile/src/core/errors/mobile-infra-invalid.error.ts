/**
 * Stackra file contract:
 * Purpose: `MobileInfraInvalidError`, thrown when the runways cannot give a mobile release plan, or when the stack
 *          config gives a fact the wrong shape: names the source and every invalid path.
 * Boundary: a plain `Error`, not a refusal: a bad runway or stack config is an operator's mistake found by
 *           `stackra infra gen` or `pulumi preview` before anything deploys. Mobile facts are ids, never secret
 *           values, so the issues may quote them.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (enforcement), ADR 0171 (decision 4: `ref:` values), ADR 0325 (rule 1: a deploy
 *                     checks its inputs before it starts).
 */
import type { RunwayIssue } from "@stackra/runway";

/**
 * A mobile release plan or its stack config that fails a check.
 *
 * @example
 * try {
 *   mobileInfraPlan(root, app, identity);
 * } catch (error) {
 *   if (error instanceof MobileInfraInvalidError) error.issues; // [{ path: "root.providers.expo.projectId", … }]
 * }
 */
export class MobileInfraInvalidError extends Error {
  /** Where the facts came from: the runways, or the Pulumi stack config. */
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
    this.name = "MobileInfraInvalidError";
    this.source = source;
    this.issues = Object.freeze([...issues]);
  }
}
