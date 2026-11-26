/**
 * Stackra file contract:
 * Purpose: `RunwayDeployFailedError`, thrown when a target of a deploy, promotion or rollback does not verify: names the
 *          target, carries the results that landed before it, and stops the release there (a release rolls region by
 *          region, so later targets are not touched). A rollback goes on to every target and throws once, naming each
 *          target that is down and carrying every result.
 * Boundary: a plain `Error`, not a refusal: the operator reads it in the CLI or the CI log. The detail is the provider's
 *           operator text and holds no secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: verify after apply), OS-12 (region by region), ADR 0170 (rollback).
 */
import { HealthStatus } from "@stackra/contracts";

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
  /** The target that failed (for a rollback, every target that is down, comma-separated). */
  readonly target: string;

  /** The targets that landed before it, in release order, the failed one last (for a rollback, every target). */
  readonly results: readonly DeployResult[];

  /**
   * @param target - the failed target's id, or a rollback's down targets, comma-separated.
   * @param results - every result so far, the failed one last; the message carries each down result's detail.
   */
  constructor(target: string, results: readonly DeployResult[]) {
    const down = results.filter((result) => result.report.status === HealthStatus.Down);
    const details = (down.length === 0 ? results.slice(-1) : down)
      .map((result) => result.report.detail)
      .filter((detail) => detail !== undefined);
    super(`${target} did not verify${details.length === 0 ? "" : `: ${details.join("; ")}`}`);
    this.name = "RunwayDeployFailedError";
    this.target = target;
    this.results = Object.freeze([...results]);
  }
}
