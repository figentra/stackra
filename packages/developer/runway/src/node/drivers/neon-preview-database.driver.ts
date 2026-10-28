/**
 * Stackra file contract:
 * Purpose: `NeonPreviewDatabaseDriver`, the `neon` driver of the `PreviewDatabaseBrancher` port: creates a preview's
 *          branch from its parent with `neonctl branches create`, reads its connection string with
 *          `neonctl connection-string`, and deletes it with `neonctl branches delete`, each in the runway's project.
 * Boundary: runs `neonctl` only, through the given `CommandRunner`; the API key is neonctl's own login
 *           (`NEON_API_KEY` in CI), never an argument. Create and remove list the project's branches first, so both
 *           are idempotent. The connection string is returned, never logged.
 * Runtime: node
 * Governing contract: ADR 0238 (decision 1: Neon is allowed), ADR 0352 (decision 3: a provider runs the
 *                     destination's own CLI).
 */
import { Driver } from "@stackra/container";

import { PreviewDatabaseBrancher } from "#core/ports/preview-database-brancher.port";
import type { PreviewDatabase } from "#core/types/preview-database.type";
import { runCommand } from "#node/functions/run-command.function";
import type { CommandRunner } from "#node/types/command-runner.type";

/** A preview database that is a branch. */
type BranchDatabase = Extract<PreviewDatabase, { from: "branch" }>;

/**
 * Preview database branches on Neon.
 *
 * @example
 * const database = previewDatabaseOf(root, "feat/checkout");
 * if (database.from === "branch") await new NeonPreviewDatabaseDriver().create(database);
 */
export class NeonPreviewDatabaseDriver extends Driver(PreviewDatabaseBrancher) {
  /** The branching service this driver serves. */
  override readonly provider = "neon";

  /** The command runner, `runCommand`; a test or a dry run replaces it. */
  run: CommandRunner = runCommand;

  /** Creates `database.name` from its parent unless it exists. */
  override async create(database: BranchDatabase): Promise<void> {
    if (await this.exists(database)) return;
    await this.run(
      "neonctl",
      [
        "branches",
        "create",
        "--project-id",
        database.project,
        "--name",
        database.name,
        "--parent",
        database.parent,
        "--output",
        "json",
      ],
      {},
    );
  }

  /** The branch's connection string. */
  override async connectionString(database: BranchDatabase): Promise<string> {
    const output = await this.run(
      "neonctl",
      ["connection-string", database.name, "--project-id", database.project],
      {},
    );
    return output.trim();
  }

  /** Deletes `database.name` when it exists. */
  override async remove(database: BranchDatabase): Promise<void> {
    if (!(await this.exists(database))) return;
    await this.run(
      "neonctl",
      ["branches", "delete", database.name, "--project-id", database.project],
      {},
    );
  }

  /** Whether the project already has the branch. */
  private async exists(database: BranchDatabase): Promise<boolean> {
    const output = await this.run(
      "neonctl",
      ["branches", "list", "--project-id", database.project, "--output", "json"],
      {},
    );
    const parsed: unknown = JSON.parse(output);
    // neonctl prints the array, or the API's `{ branches: [...] }` envelope in older versions.
    const branches =
      typeof parsed === "object" && parsed !== null && "branches" in parsed
        ? (parsed as { branches: unknown }).branches
        : parsed;
    return (
      Array.isArray(branches) &&
      branches.some(
        (branch) =>
          typeof branch === "object" &&
          branch !== null &&
          (branch as { name?: unknown }).name === database.name,
      )
    );
  }
}
