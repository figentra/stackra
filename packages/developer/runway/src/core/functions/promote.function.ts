/**
 * Stackra file contract:
 * Purpose: `promote(root, from, to, providers, sha?)`, moves what one environment runs to the next: the commit is the
 *          one given, or the one `from`'s first target runs now; `to` must be an environment that deploys on promotion
 *          (`deploy.on: promote`), and the commit then ships to every target of `to`, dedicated tenants included.
 * Boundary: orchestration only; the approval (a GitHub environment) happens before the CLI runs it in CI (ADR 0170
 *           decision 6). Never builds: a promotion ships a commit `from` already runs.
 * Runtime: isomorphic
 * Governing contract: ADR 0170 (decisions 6 and 10), ADR 0352 (decisions 1 and 3), ADR 0400 (one release train).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { deploy } from "#core/functions/deploy.function";
import { deployTargets } from "#core/functions/deploy-targets.function";
import { providerFor } from "#core/functions/provider-for.function";
import type { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployResult } from "#core/types/deploy-result.type";
import type { RootRunway } from "#core/types/root-runway.type";

/**
 * The results of promoting `from` to `to`.
 *
 * @param sha - the commit to promote; read from `from`'s first target when absent.
 * @throws RunwayInvalidError when `to` does not deploy on promotion.
 * @throws RunwayUnresolvedError when no commit is given and `from` runs none.
 * @throws RunwayDeployFailedError at the first target of `to` that does not verify.
 * @example
 * await promote(root, "staging", "production", providers);
 */
export async function promote(
  root: RootRunway,
  from: RunwayEnvironment,
  to: RunwayEnvironment,
  providers: readonly RunwayProvider[],
  sha?: string,
): Promise<DeployResult[]> {
  if (root.environments[to]?.deploy?.on !== "promote")
    throw new RunwayInvalidError("runway.yaml", [
      {
        path: `environments.${to}.deploy.on`,
        message: `${to} is not deployed by promotion: set \`deploy.on: promote\``,
      },
    ]);
  let commit = sha;
  if (commit === undefined) {
    const [first] = deployTargets(root, from);
    commit =
      first === undefined
        ? undefined
        : ((await providerFor(first, providers).current(first)) ?? undefined);
  }
  if (commit === undefined)
    throw new RunwayUnresolvedError(`${from} runs no release to promote; name the commit`);
  return deploy(root, to, commit, providers);
}
