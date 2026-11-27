/**
 * Stackra file contract:
 * Purpose: `RunwayEnvMissingCommand`, `runway env missing <env> [--dir <dir>]` (`runway env:missing`): before a deploy,
 *          names each secret the deploy of `env` syncs that the environment's sops scope does not hold (`envMissing`),
 *          read from the scope's ciphertext file names. A required one fails the run (exit 1); an optional one is a
 *          warning, since the sync writes an empty placeholder.
 * Boundary: CI only (its GitHub OIDC token proves the job); prints names, members and the scope, never a value, and
 *           decrypts nothing. The secrets-decrypt action runs it when its `check-environment` input is set.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0371 (amendment 2026-11-27); ADR 0173 (amendment 2026-11-04, decision 4);
 *                     STA-258.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { envMissing } from "#node/functions/env-missing.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Fails a deploy whose sops scope lacks a required secret. */
export class RunwayEnvMissingCommand extends Command({
  name: "env:missing",
  bin: true,
  description:
    "Fail when an environment's sops scope lacks a secret its deploy syncs; optional ones warn (CI only, names only)",
  examples: ["runway env missing staging --dir .secrets"],
}) {
  /** The environment whose scope is read. */
  @Argument({ description: "The environment (dev, preview, staging, production)" })
  environment!: string;

  /** Where the scope's ciphertext was downloaded. */
  @Option({ description: "The folder holding <scope>/<NAME>.enc.yaml (default .secrets)" })
  @Str
  dir = ".secrets";

  /** The read; a test replaces it. */
  missing: typeof envMissing = envMissing;

  /**
   * Prints each finding and resolves with 1 when one is an error, else 0.
   *
   * @throws RunwayUnresolvedError outside a proved CI job, or when the scope's ciphertext is missing.
   */
  async handle(io: CommandIo): Promise<number> {
    const findings = await this.missing({
      root: repositoryRoot(io.cwd),
      environment: this.environment,
      dir: this.dir.startsWith("/") ? this.dir : `${io.cwd}/${this.dir}`,
    });
    for (const { level, name, where, message } of findings) {
      const line = `${name} (${where}) ${message}`;
      if (level === "error") io.output.error(line);
      else io.output.warn(line);
    }
    const errors = findings.filter((finding) => finding.level === "error").length;
    if (errors === 0)
      io.output.success(
        `${this.environment}: the scope holds every required secret, ${findings.length} optional absent`,
      );
    return errors === 0 ? 0 : 1;
  }
}
