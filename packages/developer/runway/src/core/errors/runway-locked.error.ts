/**
 * Stackra file contract:
 * Purpose: `RunwayLockedError`, thrown when another apply holds an environment's deploy lock: a deploy, promotion,
 *          rollback or settings promotion is already running there, so this one does not start.
 * Boundary: a plain `Error`, not a refusal: the operator reads it in the CLI or the CI log and runs again once the other
 *           apply ends. It names the environment only.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3), ADR 0435 (decision 2).
 */

/**
 * An environment another apply is changing.
 *
 * @example
 * try {
 *   await withDeployLock(root, "production", locks, () => deploy(root, "production", sha, providers));
 * } catch (error) {
 *   if (error instanceof RunwayLockedError) error.environment; // "production"
 * }
 */
export class RunwayLockedError extends Error {
  /** The environment whose lock is held. */
  readonly environment: string;

  /** @param environment - the environment whose lock is held. */
  constructor(environment: string) {
    super(`Another apply is running in ${environment}; run again once it ends`);
    this.name = "RunwayLockedError";
    this.environment = environment;
  }
}
