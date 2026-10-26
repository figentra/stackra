/**
 * Stackra file contract:
 * Purpose: `withDeployLock(root, environment, lock, work, ttl?)`, runs one apply to an environment (a code `deploy`,
 *          `promote` or `rollback`, or a settings promotion) holding that environment's deploy lock, so two applies
 *          never change one environment at once. A held lock refuses at once; it never queues.
 * Boundary: orchestration only; the lock store is the caller's `Locks` (`DeployLock`). The key is
 *           `runway:deploy:<project>:<environment>`, one per environment of the root runway, shared by every kind of
 *           apply. The lease is renewed while `work` runs, so `ttl` only bounds how long a crashed holder blocks the
 *           environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3), ADR 0103 (decision 1), ADR 0149, ADR 0435 (decision 2).
 */
import { Duration } from "@stackra/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayLockedError } from "#core/errors/runway-locked.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployLock } from "#core/types/deploy-lock.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** How long a crashed holder blocks the environment when the caller names no TTL. */
const DEFAULT_TTL = Duration.minutes(30);

/**
 * The result of `work`, run holding `environment`'s deploy lock.
 *
 * @param ttl - how long the lease outlives a holder that stops renewing it.
 * @throws RunwayUnresolvedError when the root runway has no such environment.
 * @throws RunwayLockedError when another apply holds the lock; `work` did not run.
 * @example
 * await withDeployLock(root, "production", locks, () => promote(root, "staging", "production", providers));
 * await withDeployLock(root, "production", locks, () => settingsApply(options));
 */
export async function withDeployLock<T>(
  root: RootRunway,
  environment: RunwayEnvironment,
  lock: DeployLock,
  work: () => Promise<T>,
  ttl: Duration = DEFAULT_TTL,
): Promise<T> {
  if (root.environments[environment] === undefined)
    throw new RunwayUnresolvedError(`The root runway has no \`environments.${environment}\``);
  let result: { value: T } | undefined;
  const ran = await lock.tryWith(`runway:deploy:${root.project}:${environment}`, ttl, async () => {
    result = { value: await work() };
  });
  if (!ran || result === undefined) throw new RunwayLockedError(environment);
  return result.value;
}
