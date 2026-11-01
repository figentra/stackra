/**
 * Stackra file contract:
 * Purpose: `DbMigrateCommand`, `db:migrate`: applies the member's pending migrations through `migrate`.
 * Boundary: runs against `DATABASE_DIRECT_URL` (else `DATABASE_URL`) as `migrate` does, keeping its refusals (an edited
 *           applied file, a dirty version). Audited: each run is recorded through `CommandAudit`.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015; ADR 0159; ADR 0506.
 */
import { commandEnvironment } from "#node/functions/command-environment.function";
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import type { DatabaseRunner } from "#node/services/database-runner.service";

/** Applies the pending migrations. */
export class DbMigrateCommand extends Command({
  name: "db:migrate",
  description: "Apply the pending database migrations",
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

  /** The runner the command calls. */
  private readonly runner: DatabaseRunner;

  /**
   * @param runner - the migration and seed runner.
   */
  constructor(runner: DatabaseRunner) {
    super();
    this.runner = runner;
  }

  /** Applies the files and returns their names. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = commandEnvironment(this.env);
    const { applied } = await io.output.task("Applying migrations", () =>
      this.runner.migrate({ cwd: this.cwd, environment: environment }),
    );
    if (applied.length === 0) io.output.info("Nothing to migrate");
    else io.output.list(applied);
    return { applied };
  }
}
