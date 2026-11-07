/**
 * Stackra file contract:
 * Purpose: `checkEnvValues({ root, environment })`, `runway env check --values`: each declared name of `environment`
 *          (errors) and of its sibling non-production environments (warnings) is read from its Infisical home and
 *          checked against its rules (`envValueFailure`).
 * Boundary: CI only (`prepareEnvRead` proves the job). Values stay in memory; a result carries the name, its home, pass
 *           or the broken rule, and at most the first eight hex characters of the value's SHA-256, never the value.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { createHash } from "node:crypto";

import { envValueFailure } from "#core/functions/env-value-failure.function";
import { exportInfisicalFolder } from "#node/functions/export-infisical-folder.function";
import { prepareEnvRead } from "#node/functions/prepare-env-read.function";
import type { EnvReadInput } from "#node/types/env-read-input.type";
import type { EnvValueResult } from "#node/types/env-value-result.type";

/** The first eight hex characters of `value`'s SHA-256. */
const hashOf = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 8);

/**
 * Checks every declared value of `environment` (errors) and of its sibling environments (warnings).
 *
 * @throws RunwayUnresolvedError outside a proved CI job, with no project id, or for an unknown environment.
 * @example
 * const results = await checkEnvValues({ root, environment: "staging", projectId });
 * results.filter((result) => result.failure !== undefined && result.level === "error");
 */
export async function checkEnvValues(input: EnvReadInput): Promise<EnvValueResult[]> {
  const { runways, projectId, environments, homes } = await prepareEnvRead(input);
  const infisical = runways.root.providers.infisical;
  const results: EnvValueResult[] = [];
  for (const environment of environments) {
    const level = environment === input.environment ? "error" : "warning";
    const slug = infisical?.environments?.[environment];
    for (const { path, rows } of homes(environment)) {
      if (slug === undefined) {
        for (const { name } of rows)
          results.push({
            level,
            environment,
            name,
            where: `(unmapped):${path}`,
            failure: `no Infisical environment for ${environment} (providers.infisical.environments)`,
          });
        continue;
      }
      const where = `${slug}:${path}`;
      let pairs: ReadonlyMap<string, string>;
      try {
        pairs = await exportInfisicalFolder({
          projectId,
          environment: slug,
          path,
          domain: infisical?.domain,
          run: input.run,
        });
      } catch (error) {
        if (level === "error") throw error;
        for (const { name } of rows)
          results.push({ level, environment, name, where, failure: "folder not readable" });
        continue;
      }
      for (const row of rows) {
        const value = pairs.get(row.name);
        const failure = envValueFailure(row, value, environment);
        results.push({
          level,
          environment,
          name: row.name,
          where,
          ...(failure === undefined ? {} : { failure }),
          ...(value === undefined || value === "" ? {} : { hash: hashOf(value) }),
        });
      }
    }
  }
  return results;
}
