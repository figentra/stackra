/**
 * Stackra file contract:
 * Purpose: `DbStatusCommand`, `db:status`: lists each compiled migration file with whether it is applied, and the
 *          recorded version and dirty flag.
 * Boundary: reads only, through `DatabaseRunner.status` (which takes the runner's advisory lock for the read). Audited.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015; ADR 0159.
 */
import { commandEnvironment } from "#node/functions/command-environment.function";
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import type { DatabaseRunner } from "#node/services/database-runner.service";

/** Shows which migrations are applied. */
export class DbStatusCommand extends Command({
  name: "db:status",
  description: "Show which database migrations are applied",
  audit: true,
}) {
  /** The member's root folder. */
  @Option({ description: "The member's folder; the current folder by default" })
  @Str
  cwd = process.cwd();

  /** The runway environment, named in the report. */
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

  /** Reads the state and returns it. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const environment = commandEnvironment(this.env);
    const { version, dirty, migrations } = await this.runner.status(this.cwd);
    io.output.keyValue({ Environment: environment, Version: version, Dirty: dirty ? "yes" : "no" });
    io.output.table(
      ["Migration", "Applied"],
      migrations.map((migration) => [migration.name, migration.applied ? "yes" : "no"]),
    );
    return { environment: environment, version, dirty, migrations };
  }
}
