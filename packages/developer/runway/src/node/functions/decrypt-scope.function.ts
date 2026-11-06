/**
 * Stackra file contract:
 * Purpose: `decryptScope({ dir, scope, names, run })`, the values of one figentra/secrets scope (ADR 0525), decrypted in
 *          memory from the scope's ciphertext the shared action downloaded: every `<dir>/<scope>/<NAME>.enc.yaml`
 *          (one file per secret), or only `names`. Each file is `sops decrypt`ed with the job's own Cloud KMS identity
 *          and must hold its own name.
 * Boundary: values live only in the returned map; nothing here prints, logs or writes one, and every failure is a
 *           fixed, value-free message (sops' own text is inspected, never repeated). Subfolders are other scopes and
 *           are not read. Which job may decrypt which scope is Cloud KMS's (figentra/infra's Workload Identity pins),
 *           not this function's.
 * Runtime: node
 * Governing contract: ADR 0525 (SOPS and Cloud KMS replace Infisical; CI decrypts in place); ADR 0257; ADR 0267.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { runProgram } from "#node/functions/run-program.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A scope, as figentra/secrets' `.sops.yaml` keys them (tools/scripts/secrets-sops.mjs `SCOPE_RX`). */
const SCOPE =
  /^(?:agents|ci\/(?:build|deploy|production|flow)(?:\/[a-z0-9-]+)*|products\/[a-z0-9-]+\/(?:dev|staging|production))$/;

/** A secret name: SCREAMING_SNAKE. */
const NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/** The suffix of one secret's file. */
const SUFFIX = ".enc.yaml";

/**
 * Every value of `scope` under `dir`, or of `names` only, by name.
 *
 * @example
 * await decryptScope({ dir: ".secrets", scope: "ci/build/registry", names: ["STACKRA_REGISTRY_TOKEN"] });
 * // Map { "STACKRA_REGISTRY_TOKEN" => <in memory> }
 * @throws RunwayUnresolvedError for a bad scope or name, a missing folder or file, or a refused decrypt.
 */
export async function decryptScope(input: {
  readonly dir: string;
  readonly scope: string;
  readonly names?: readonly string[] | undefined;
  readonly run?: CommandRunner | undefined;
}): Promise<Map<string, string>> {
  const { dir, scope, run = runProgram } = input;
  if (!SCOPE.test(scope))
    throw new RunwayUnresolvedError(
      "--scope must be agents, ci/<build|deploy|production|flow>[/folder] or products/<product>/<env>",
    );
  const folder = join(dir, scope);
  if (!existsSync(folder))
    throw new RunwayUnresolvedError(
      `no ciphertext for ${scope} under ${dir}: download the scope first`,
    );
  const present = readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(SUFFIX))
    .map((entry) => entry.name.slice(0, -SUFFIX.length))
    .filter((name) => NAME.test(name))
    .toSorted();
  const wanted = input.names === undefined || input.names.length === 0 ? present : [...input.names];
  const bad = wanted.filter((name) => !NAME.test(name));
  if (bad.length > 0) throw new RunwayUnresolvedError(`not SCREAMING_SNAKE: ${bad.join(", ")}`);
  const missing = wanted.filter((name) => !present.includes(name));
  if (missing.length > 0) throw new RunwayUnresolvedError(`${scope} has no ${missing.join(", ")}`);

  const values = new Map<string, string>();
  for (const name of wanted) {
    let output: string;
    try {
      output = await run(
        "sops",
        ["decrypt", "--output-type", "json", join(folder, `${name}${SUFFIX}`)],
        {},
      );
    } catch (error) {
      // sops' message may name the key or the identity, never a value; still, only a fixed sentence leaves here.
      const refused = /permission|denied|403|unauthenticated|credentials/i.test(String(error));
      throw new RunwayUnresolvedError(
        refused
          ? `${scope}/${name}: this job's identity may not decrypt ${scope}`
          : `${scope}/${name}: sops could not decrypt the file`,
      );
    }
    let document: unknown;
    try {
      document = JSON.parse(output);
    } catch {
      throw new RunwayUnresolvedError(`${scope}/${name}: sops returned no JSON`);
    }
    const value = (document as Record<string, unknown> | null)?.[name];
    if (typeof value !== "string")
      throw new RunwayUnresolvedError(`${scope}/${name}: the file does not hold its own name`);
    values.set(name, value);
  }
  return values;
}
