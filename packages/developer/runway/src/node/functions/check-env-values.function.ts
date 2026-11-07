/**
 * Stackra file contract:
 * Purpose: `checkEnvValues({ root, environment })`, `runway env check --values`: each declared name of `environment`
 *          is read from the job's environment, where the secrets-decrypt action put the environment's sops scope (ADR
 *          0525), and checked against its rules (`envValueFailure`).
 * Boundary: CI only (`prepareEnvRead` proves the job). Values stay in memory; a result carries the name, its scope, pass
 *           or the broken rule, and at most the first eight hex characters of the value's SHA-256, never the value.
 *           One job decrypts one scope, so only `environment` is checked.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { createHash } from "node:crypto";

import { envValueFailure } from "#core/functions/env-value-failure.function";
import { prepareEnvRead } from "#node/functions/prepare-env-read.function";
import type { EnvReadInput } from "#node/types/env-read-input.type";
import type { EnvValueResult } from "#node/types/env-value-result.type";

/** The first eight hex characters of `value`'s SHA-256. */
const hashOf = (value: string): string =>
  createHash("sha256").update(value).digest("hex").slice(0, 8);

/**
 * Checks every declared value of `environment`; a broken rule is an error.
 *
 * @throws RunwayUnresolvedError outside a proved CI job, or for an unknown environment.
 * @example
 * const results = await checkEnvValues({ root, environment: "staging" });
 * results.filter((result) => result.failure !== undefined);
 */
export async function checkEnvValues(input: EnvReadInput): Promise<EnvValueResult[]> {
  const { scope, homes } = await prepareEnvRead(input);
  const env = input.env ?? process.env;
  const where = scope ?? "(no project, no scope)";
  return homes.flatMap(({ rows }) =>
    rows.map((row) => {
      const value = env[row.name];
      const failure = envValueFailure(row, value, input.environment);
      return {
        level: "error" as const,
        environment: input.environment,
        name: row.name,
        where,
        ...(failure === undefined ? {} : { failure }),
        ...(value === undefined || value === "" ? {} : { hash: hashOf(value) }),
      };
    }),
  );
}
