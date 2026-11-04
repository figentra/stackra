/**
 * Stackra file contract:
 * Purpose: `RunwayEnvOrphansCommand`, `runway env orphans <env> [--project-id <id>]` (`runway env:orphans`): warns on
 *          each name in an Infisical home of `env` that no member declares (`envOrphans`). Always exits 0.
 * Boundary: CI only (its GitHub OIDC token proves the job); prints names and homes, never a value.
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04, decision 4); STA-2104.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";

import { envOrphans } from "#node/functions/env-orphans.function";
import { repositoryRoot } from "#node/functions/repository-root.function";

/** Warns on Infisical names nothing declares. */
export class RunwayEnvOrphansCommand extends Command({
  name: "env:orphans",
  description:
    "Warn on Infisical names in an environment's runtime homes that no code declares (CI only)",
  examples: ["runway env orphans staging --project-id <id>"],
}) {
  /** The environment whose homes are read. */
  @Argument({ description: "The environment (dev, preview, staging, production)" })
  environment!: string;

  /** The runtime Infisical project id; `providers.infisical.workspace` by default. */
  @Option({ description: "The Infisical project id of the environment's runtime project" })
  projectId?: string;

  /** The read; a test replaces it. */
  orphans: typeof envOrphans = envOrphans;

  /**
   * Prints a warning per orphan and resolves with 0.
   *
   * @throws RunwayUnresolvedError outside a proved CI job, or when a home cannot be read.
   */
  async handle(io: CommandIo): Promise<number> {
    const found = await this.orphans({
      root: repositoryRoot(io.cwd),
      environment: this.environment,
      projectId: this.projectId,
    });
    for (const { name, where } of found)
      io.output.warn(`${name} (${where}) is in Infisical but no code declares it`);
    if (found.length === 0) io.output.success(`no orphan names in ${this.environment}`);
    return 0;
  }
}
