/**
 * Stackra file contract:
 * Purpose: `envOrphans({ root, environment })`, `runway env orphans`: the names in the Infisical homes of
 *          `environment` that no member declares.
 * Boundary: CI only (`prepareEnvRead` proves the job); returns names and homes, never a value.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { exportInfisicalFolder } from "#node/functions/export-infisical-folder.function";
import { prepareEnvRead } from "#node/functions/prepare-env-read.function";
import type { EnvReadInput } from "#node/types/env-read-input.type";

/**
 * The names in the Infisical homes of `environment` that no member declares.
 *
 * @throws RunwayUnresolvedError as `checkEnvValues` does, or when a home cannot be read.
 * @example
 * (await envOrphans({ root, environment: "staging", projectId })).map((orphan) => orphan.name);
 */
export async function envOrphans(
  input: EnvReadInput,
): Promise<{ readonly name: string; readonly where: string }[]> {
  const { runways, projectId, homes: homesIn } = await prepareEnvRead(input);
  const infisical = runways.root.providers.infisical;
  const slug = infisical?.environments?.[input.environment];
  if (slug === undefined)
    throw new RunwayUnresolvedError(
      `runway.yaml maps no Infisical environment for ${input.environment} (providers.infisical.environments)`,
    );
  const homes = homesIn(input.environment);
  const declared = new Set(homes.flatMap(({ rows }) => rows.map((row) => row.name)));
  const orphans: { name: string; where: string }[] = [];
  for (const path of new Set(homes.map((home) => home.path))) {
    const pairs = await exportInfisicalFolder({
      projectId,
      environment: slug,
      path,
      domain: infisical?.domain,
      run: input.run,
    });
    for (const name of pairs.keys())
      if (!declared.has(name)) orphans.push({ name, where: `${slug}:${path}` });
  }
  return orphans;
}
