/**
 * Stackra file contract:
 * Purpose: `prepareEnvRead(input)`, the shared start of `runway env check --values` and `runway env orphans`: proves
 *          the CI job by its GitHub OIDC token, resolves the runtime project id (`--project-id`, else
 *          `providers.infisical.workspace`) and the environments to read (the target; with it, the other
 *          non-production environments, which the same identity reads), and gives each environment's homes: every
 *          deployable member's gen `env` rows needed there plus its runway `secrets:`, at `/runtime/<member>`.
 * Boundary: reads files and the OIDC token only; never a value. Production is never read with another environment.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { EnvRow } from "#core/types/env-row.type";
import { proveGithubJob } from "#node/functions/prove-github-job.function";
import { readRunways } from "#node/functions/read-runways.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { DeployRunways } from "#node/types/deploy-runways.type";
import type { EnvHome } from "#node/types/env-home.type";
import type { EnvReadInput } from "#node/types/env-read-input.type";

/** Each deployable member's declared rows needed in `environment`, with its home. */
function homesOf(root: string, runways: DeployRunways, environment: string): EnvHome[] {
  const plan = secretSyncPlan(environment, runways);
  return runways.members.flatMap(({ member, folder = "apps" }) => {
    const file = join(root, folder, member, "stackra.manifest.json");
    const manifest = existsSync(file)
      ? (JSON.parse(readFileSync(file, "utf8")) as {
          env?: readonly (EnvRow & { home?: string; environments?: readonly string[] })[];
        })
      : {};
    const rows: EnvRow[] = (manifest.env ?? []).filter(
      (row) => row.environments === undefined || row.environments.includes(environment),
    );
    const entry = plan.find((candidate) => candidate.member === member);
    for (const name of entry?.names ?? [])
      if (!rows.some((row) => row.name === name)) rows.push({ name, required: true });
    if (rows.length === 0) return [];
    const path =
      manifest.env?.find((row) => row.home !== undefined)?.home ??
      entry?.path ??
      `/runtime/${member}`;
    return [{ member, path, rows }];
  });
}

/**
 * Proves the CI job, resolves the project id and the environments to read (target first), and gives each
 * environment's homes.
 *
 * @throws RunwayUnresolvedError outside a proved CI job, with no project id, or for an unknown environment.
 * @example
 * const { homes } = await prepareEnvRead({ root, environment: "staging", projectId });
 */
export async function prepareEnvRead(input: EnvReadInput): Promise<{
  readonly runways: DeployRunways;
  readonly projectId: string;
  readonly environments: readonly string[];
  readonly homes: (environment: string) => EnvHome[];
}> {
  const runways = readRunways(input.root);
  if (input.ci === false)
    throw new RunwayUnresolvedError(
      "environment values are read only in a CI job of the repository (proved by its GitHub OIDC token); `runway env check` checks the names anywhere",
    );
  if (input.ci === undefined) await proveGithubJob({ github: runways.root.providers.github });
  const projectId = input.projectId ?? runways.root.providers.infisical?.workspace;
  if (projectId === undefined || projectId.startsWith("ref:"))
    throw new RunwayUnresolvedError(
      "no Infisical project id for the runtime values: pass --project-id (the job's `<project>-runtime` project) or set providers.infisical.workspace",
    );
  const all = Object.keys(runways.root.environments ?? {});
  if (!all.includes(input.environment))
    throw new RunwayUnresolvedError(`runway.yaml has no environment ${input.environment}`);
  // One identity reads dev and staging (`<project>-runtime`); production is its own project.
  const others =
    input.environment === "production"
      ? []
      : all.filter((name) => name !== input.environment && name !== "production");
  return {
    runways,
    projectId,
    environments: [input.environment, ...others],
    homes: (environment) => homesOf(input.root, runways, environment),
  };
}
