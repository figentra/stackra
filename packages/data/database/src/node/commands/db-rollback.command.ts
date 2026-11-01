/**
 * Stackra file contract:
 * Purpose: `DbRollbackCommand`, `db:rollback`: reverts the last migration through `rollback`.
 * Boundary: destructive, so it asks for confirmation when interactive and otherwise needs `--force` (exit 2 naming it).
 *           `rollback` keeps its own refusals (forward-only environments, a dirty version, an irreversible step).
 *           Audited.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-013 and FR-015; ADR 0159.
 */
import { commandEnvironment } from "#node/functions/command-environment.function";
import { Command, Option, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import type { DatabaseRunner } from "#node/services/database-runner.service";

/** Reverts the last migration. */
export class DbRollbackCommand extends Command({
  name: "db:rollback",
  description: "Revert the last database migration (dev, preview and test only)",
  audit: true,
}) {
  /** The member's root folder. */
  @Option({ description: "The member's folder; the current folder by default" })
  @Str
  cwd = process.cwd();

  /** The runway environment. */
  @Option({
    description: "The environment; STACKRA_ENVIRONMENT, else dev; never one that contradicts it",
  })
  @Str
  env = "";

  /** Skip the confirmation. */
  @Option({ description: "Revert without asking" })
  force = false;

  /** The runner the command calls. */
  private readonly runner: DatabaseRunner;

  /**
   * @param runner - the migration and seed runner.
   */
  constructor(runner: DatabaseRunner) {
    super();
    this.runner = runner;
  }

  /** Reverts the steps and returns their names. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = commandEnvironment(this.env);
    if (!this.force) {
      if (!io.interactive)
        throw new UsageError("db:rollback reverts data and needs confirmation", "Add --force");
      const sure = await io.prompt.confirm({
        message: `Revert the last migration in ${environment}?`,
        default: false,
      });
      if (!sure) {
        io.output.warn("Cancelled");
        return { reverted: [], cancelled: true };
      }
    }
    const { reverted } = await io.output.task("Reverting the last migration", () =>
      this.runner.rollback({ cwd: this.cwd, environment: environment }),
    );
    if (reverted.length === 0) io.output.info("Nothing to revert");
    else io.output.list(reverted);
    return { reverted };
  }
}
