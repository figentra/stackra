/**
 * Stackra file contract:
 * Purpose: `RunwayDeployFailedError`, thrown when a target of a deploy, promotion or rollback does not verify: names the
 *          target, carries the results that landed before it, and stops the release there (a release rolls region by
 *          region, so later targets are not touched).
 * Boundary: a plain `Error`, not a refusal: the operator reads it in the CLI or the CI log. The detail is the provider's
 *           operator text and holds no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: verify after apply), OS-12 (region by region), ADR 0170 (rollback).
 */
import type { DeployResult } from "#core/types/deploy-result.type";

/**
 * A target that did not verify.
 *
 * @example
 * try {
 *   await deploy(root, "production", sha, providers);
 * } catch (error) {
 *   if (error instanceof RunwayDeployFailedError) error.target; // "production/services/ksa"
 * }
 */
export class RunwayDeployFailedError extends Error {
  /** The target that failed. */
  readonly target: string;

  /** The targets that landed before it, in release order, the failed one last. */
  readonly results: readonly DeployResult[];

  /**
   * @param target - the failed target's id.
   * @param results - every result so far, the failed one last.
   */
  constructor(target: string, results: readonly DeployResult[]) {
    const detail = results.at(-1)?.report.detail;
    super(`${target} did not verify${detail === undefined ? "" : `: ${detail}`}`);
    this.name = "RunwayDeployFailedError";
    this.target = target;
    this.results = Object.freeze([...results]);
  }
}
