/**
 * Stackra file contract:
 * Purpose: `envMissing({ root, environment, dir })`, `runway env missing`: the secret names a deploy of `environment`
 *          syncs (`secretSyncPlan`: each member's runway secrets and the `secret` and `config` names its manifest
 *          declares, and the generated gateway's) that the environment's sops scope (`products/<project>/<env>`, ADR
 *          0525) does not hold, checked before anything is decrypted or deployed. A required name the scope lacks is an
 *          error; an optional one (`required: false` in code, in no runway list) is a warning, since the sync writes it
 *          as an empty placeholder unless Encore already holds a value. A name is its ciphertext file's name (`<dir>/<scope>/<NAME>.enc.yaml`).
 * Boundary: CI only (`prepareEnvRead` proves the job), like `envOrphans`, its mirror; reads file names only, never a
 *           value, and decrypts nothing. A member no runtime takes secrets from (writer `none`) is not checked.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0371 (amendment 2026-11-27); ADR 0173 (amendment 2026-11-04, decision 4);
 *                     STA-258.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { prepareEnvRead } from "#node/functions/prepare-env-read.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { EnvFinding } from "#node/types/env-finding.type";
import type { EnvReadInput } from "#node/types/env-read-input.type";

/** The suffix of one secret's ciphertext file. */
const SUFFIX = ".enc.yaml";

/**
 * The synced names of `environment` its sops scope lacks: errors first, then the optional ones as warnings.
 *
 * @param input.dir - the folder holding `<scope>/<NAME>.enc.yaml`; `<root>/.secrets` by default.
 * @throws RunwayUnresolvedError as `checkEnvValues` does, when the root names no `project`, or when the scope's
 *         ciphertext is not under `dir`.
 * @example
 * (await envMissing({ root, environment: "staging", dir: ".secrets" })).filter((finding) => finding.level === "error");
 */
export async function envMissing(
  input: EnvReadInput & { readonly dir?: string | undefined },
): Promise<EnvFinding[]> {
  const { runways, scope } = await prepareEnvRead(input);
  if (scope === null)
    throw new RunwayUnresolvedError(
      "runway.yaml names no `project`, so the environment has no sops scope",
    );
  const folder = join(input.dir ?? join(input.root, ".secrets"), scope);
  if (!existsSync(folder))
    throw new RunwayUnresolvedError(`no ciphertext for ${scope}: download the scope first`);
  const held = new Set(
    readdirSync(folder)
      .filter((file) => file.endsWith(SUFFIX))
      .map((file) => file.slice(0, -SUFFIX.length)),
  );
  const findings: EnvFinding[] = [];
  for (const entry of secretSyncPlan(input.environment, runways)) {
    if (entry.writer === "none") continue;
    const placeholders = new Set(entry.placeholders ?? []);
    for (const name of entry.names) {
      if (held.has(name)) continue;
      findings.push(
        placeholders.has(name)
          ? {
              level: "warning",
              name,
              where: entry.folder,
              message: `is not in ${scope}: it is optional, so the sync writes an empty placeholder unless Encore already holds a value`,
            }
          : {
              level: "error",
              name,
              where: entry.folder,
              message: `is not in ${scope}: add it to figentra/secrets before this deploy, or declare it optional (\`required: false\`) when an empty placeholder will do`,
            },
      );
    }
  }
  return [
    ...findings.filter((finding) => finding.level === "error"),
    ...findings.filter((finding) => finding.level === "warning"),
  ];
}
