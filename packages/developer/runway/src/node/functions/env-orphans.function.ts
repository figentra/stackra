/**
 * Stackra file contract:
 * Purpose: `envOrphans({ root, environment, dir })`, `runway env orphans`: the names in the sops scope of
 *          `environment` (`products/<project>/<env>`, ADR 0525) that no member declares. A name is its ciphertext
 *          file's name (`<dir>/<scope>/<NAME>.enc.yaml`), so nothing is decrypted.
 * Boundary: CI only (`prepareEnvRead` proves the job); reads file names only, never a value.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { prepareEnvRead } from "#node/functions/prepare-env-read.function";
import type { EnvReadInput } from "#node/types/env-read-input.type";

/** The suffix of one secret's ciphertext file. */
const SUFFIX = ".enc.yaml";

/**
 * The names in the sops scope of `environment` that no member declares.
 *
 * @param input.dir - the folder holding `<scope>/<NAME>.enc.yaml`; `<root>/.secrets` by default.
 * @throws RunwayUnresolvedError as `checkEnvValues` does, when the root names no `project`, or when the scope's
 *         ciphertext is not under `dir`.
 * @example
 * (await envOrphans({ root, environment: "staging", dir: ".secrets" })).map((orphan) => orphan.name);
 */
export async function envOrphans(
  input: EnvReadInput & { readonly dir?: string | undefined },
): Promise<{ readonly name: string; readonly where: string }[]> {
  const { scope, homes } = await prepareEnvRead(input);
  if (scope === null)
    throw new RunwayUnresolvedError(
      "runway.yaml names no `project`, so the environment has no sops scope",
    );
  const folder = join(input.dir ?? join(input.root, ".secrets"), scope);
  if (!existsSync(folder))
    throw new RunwayUnresolvedError(`no ciphertext for ${scope}: download the scope first`);
  const declared = new Set(homes.flatMap(({ rows }) => rows.map((row) => row.name)));
  return readdirSync(folder)
    .filter((file) => file.endsWith(SUFFIX))
    .map((file) => file.slice(0, -SUFFIX.length))
    .filter((name) => !declared.has(name))
    .toSorted()
    .map((name) => ({ name, where: scope }));
}
