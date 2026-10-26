/**
 * Stackra file contract:
 * Purpose: `rollback(root, environment, previous, providers)`, returns every target of an environment to what an
 *          earlier release shipped there: the caller hands back that release's records (from the release records),
 *          and each target is rolled back to its own record, then verified, in release order.
 * Boundary: orchestration only. Checks before touching anything that every target has a record and a provider, so a
 *           rollback never stops half-way for a missing input; it stops at the first target that is down, as a deploy
 *           does. A destination that cannot roll back (a store build) refuses in its provider.
 * Runtime: isomorphic
 * Governing contract: ADR 0170 (rollback), ADR 0352 (decisions 3 and 7), OS-12 (region by region).
 */
import { HealthStatus } from "@stackra/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { providerFor } from "#core/functions/provider-for.function";
import type { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployResult } from "#core/types/deploy-result.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The results of rolling `environment` back to `previous`.
 *
 * @param previous - the records of the release to return to, one per target.
 * @throws RunwayUnresolvedError when a target has no record in `previous` or no provider.
 * @throws RunwayDeployFailedError at the first target that does not verify.
 * @example
 * await rollback(root, "production", recordsOfRelease(41), providers);
 */
export async function rollback(
  root: RootRunway,
  environment: RunwayEnvironment,
  previous: readonly DeployRecord[],
  providers: readonly RunwayProvider[],
): Promise<DeployResult[]> {
  const plan = deployTargets(root, environment).map((target) => {
    const record = previous.find((candidate) => candidate.target === target.id);
    if (record === undefined)
      throw new RunwayUnresolvedError(`${target.id} has no earlier release to roll back to`);
    return [target, providerFor(target, providers), record] as const;
  });
  const results: DeployResult[] = [];
  for (const [target, provider, to] of plan) {
    const record = await provider.rollback(target, to);
    const report = await provider.verify(target, record);
    results.push({ record, report });
    if (report.status === HealthStatus.Down) throw new RunwayDeployFailedError(target.id, results);
  }
  return results;
}
