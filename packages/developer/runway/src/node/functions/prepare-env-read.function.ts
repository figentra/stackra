/**
 * Stackra file contract:
 * Purpose: `prepareEnvRead(input)`, the shared start of `runway env check --values` and `runway env orphans`: proves
 *          the CI job by its GitHub OIDC token, names the environment's sops scope (`products/<project>/<env>`, ADR
 *          0525) and gives its homes: every deployable member's gen `env` rows needed there plus its runway
 *          `secrets:`.
 * Boundary: reads files and the OIDC token only; never a value. One job decrypts one scope, so only the given
 *           environment is read.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { EnvRow } from "#core/types/env-row.type";
import { deployPlan } from "#node/functions/deploy-plan.function";
import { proveGithubJob } from "#node/functions/prove-github-job.function";
import { readRunways } from "#node/functions/read-runways.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { EnvHome } from "#node/types/env-home.type";
import type { EnvReadInput } from "#node/types/env-read-input.type";

/** Each deployable member's declared rows needed in `environment`. */
function homesOf(root: string, runways: DeployRunways, environment: string): EnvHome[] {
  const plan = secretSyncPlan(environment, runways);
  return runways.members.flatMap(({ member, folder = "apps" }) => {
    const file = join(root, folder, member, "stackra.manifest.json");
    const manifest = existsSync(file)
      ? (JSON.parse(readFileSync(file, "utf8")) as {
          env?: readonly (EnvRow & { environments?: readonly string[] })[];
        })
      : {};
    const rows: EnvRow[] = (manifest.env ?? []).filter(
      (row) => row.environments === undefined || row.environments.includes(environment),
    );
    const entry = plan.find((candidate) => candidate.member === member);
    for (const name of entry?.names ?? [])
      if (!rows.some((row) => row.name === name)) rows.push({ name, required: true });
    return rows.length === 0 ? [] : [{ member, rows }];
  });
}

/**
 * Proves the CI job, names the environment's scope and gives its homes.
 *
 * @throws RunwayUnresolvedError outside a proved CI job, or for an unknown environment.
 * @example
 * const { scope, homes } = await prepareEnvRead({ root, environment: "staging" });
 */
export async function prepareEnvRead(input: EnvReadInput): Promise<{
  readonly runways: DeployRunways;
  readonly scope: string | null;
  readonly homes: EnvHome[];
}> {
  const runways = readRunways(input.root);
  if (input.ci === false)
    throw new RunwayUnresolvedError(
      "environment values are read only in a CI job of the repository (proved by its GitHub OIDC token); `runway env check` checks the names anywhere",
    );
  if (input.ci === undefined) await proveGithubJob({ github: runways.root.providers.github });
  if (runways.root.environments?.[input.environment] === undefined)
    throw new RunwayUnresolvedError(`runway.yaml has no environment ${input.environment}`);
  return {
    runways,
    scope: deployPlan(input.environment, runways).secretScope,
    homes: homesOf(input.root, runways, input.environment),
  };
}
