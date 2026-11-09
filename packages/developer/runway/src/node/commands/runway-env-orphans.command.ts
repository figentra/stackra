/**
 * Stackra file contract:
 * Purpose: `RunwayEnvOrphansCommand`, `runway env orphans <env> [--dir <dir>]` (`runway env:orphans`): warns on each
 *          name in the sops scope of `env` that no member declares (`envOrphans`), read from the scope's ciphertext
 *          file names. Always exits 0.
 * Boundary: CI only (its GitHub OIDC token proves the job); prints names and the scope, never a value, and decrypts
 *           nothing.
 * Runtime: node
 * Governing contract: ADR 0525; ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { envOrphans } from "#node/functions/env-orphans.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Warns on sops names nothing declares. */
export class RunwayEnvOrphansCommand extends Command({
  name: "env:orphans",
  bin: true,
  description: "Warn on names in an environment's sops scope that no code declares (CI only)",
  examples: ["runway env orphans staging --dir .secrets"],
}) {
  /** The environment whose scope is read. */
  @Argument({ description: "The environment (dev, preview, staging, production)" })
  environment!: string;

  /** Where the scope's ciphertext was downloaded. */
  @Option({ description: "The folder holding <scope>/<NAME>.enc.yaml (default .secrets)" })
  @Str
  dir = ".secrets";

  /** The read; a test replaces it. */
  orphans: typeof envOrphans = envOrphans;

  /**
   * Prints a warning per orphan and resolves with 0.
   *
   * @throws RunwayUnresolvedError outside a proved CI job, or when the scope's ciphertext is missing.
   */
  async handle(io: CommandIo): Promise<number> {
    const found = await this.orphans({
      root: repositoryRoot(io.cwd),
      environment: this.environment,
      dir: this.dir.startsWith("/") ? this.dir : `${io.cwd}/${this.dir}`,
    });
    for (const { name, where } of found)
      io.output.warn(`${name} (${where}) is in the sops scope but no code declares it`);
    if (found.length === 0) io.output.success(`no orphan names in ${this.environment}`);
    return 0;
  }
}
