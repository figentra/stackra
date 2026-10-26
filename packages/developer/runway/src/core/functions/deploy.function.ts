/**
 * Stackra file contract:
 * Purpose: `deploy(root, environment, sha, providers)`, ships one commit to every target of an environment in release
 *          order: each target is applied, then verified, and the release stops at the first target that is down, so a
 *          later region or dedicated tenant keeps what it runs.
 * Boundary: orchestration only; every change is a provider's. Checks that a provider serves each target before it
 *           touches any. `degraded` (a build still running) does not stop the release. Writing the records is the
 *           caller's (ADR 0352 decision 7).
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decisions 1, 3 and 7), OS-12 (region by region), ADR 0400.
 */
import { HealthStatus } from "@stackra/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayDeployFailedError } from "#core/errors/runway-deploy-failed.error";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { providerFor } from "#core/functions/provider-for.function";
import type { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployResult } from "#core/types/deploy-result.type";
import type { RootRunway } from "#core/types/root-runway.type";

/** A full commit SHA. */
const SHA = /^[0-9a-f]{40}$/;

/**
 * The results of shipping `sha` to `environment`.
 *
 * @throws TypeError when `sha` is not a full commit SHA.
 * @throws RunwayUnresolvedError when a target has no provider or a region is undeclared.
 * @throws RunwayDeployFailedError at the first target that does not verify.
 * @example
 * const results = await deploy(root, "staging", sha, [new EncoreCloudProvider({ app: "acme" })]);
 */
export async function deploy(
  root: RootRunway,
  environment: RunwayEnvironment,
  sha: string,
  providers: readonly RunwayProvider[],
): Promise<DeployResult[]> {
  if (!SHA.test(sha)) throw new TypeError(`${sha} is not a full commit SHA`);
  const plan = deployTargets(root, environment).map(
    (target) => [target, providerFor(target, providers)] as const,
  );
  const results: DeployResult[] = [];
  for (const [target, provider] of plan) {
    const record = await provider.apply(target, sha);
    const report = await provider.verify(target, record);
    results.push({ record, report });
    if (report.status === HealthStatus.Down) throw new RunwayDeployFailedError(target.id, results);
  }
  return results;
}
