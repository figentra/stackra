/**
 * Stackra file contract:
 * Purpose: `DbMigrateCommand`, `db:migrate`: applies the member's pending migrations through `migrate`.
 * Boundary: runs against `DATABASE_DIRECT_URL` (else `DATABASE_URL`) as `migrate` does, keeping its refusals (an edited
 *           applied file, a dirty version). The release applied is @stackra/console's `migrationRelease`, the chain
 *           `stackra db migrate` uses: `--release`, else `STACKRA_RELEASE`, else the commit of the checkout at `--cwd`;
 *           with none, `migrate` refuses a forward-only run holding a contract step, naming `--release` and
 *           `STACKRA_RELEASE`. Audited: each run is recorded through `CommandAudit`.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-001 and FR-015; ADR 0159; ADR 0506.
 */
import { commandEnvironment } from "#node/functions/command-environment.function";
import { Command, migrationRelease, Option } from "@stackra/console";
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

  /** The release this run applies. */
  @Option({
    description:
      "The release applied (version, tag or commit), which contract steps' release gates compare; STACKRA_RELEASE, else the checkout's commit, when absent",
  })
  @Str
  release = "";

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
    const release = await migrationRelease(
      this.release,
      { cwd: this.cwd, process: io.process },
      process.env,
    );
    const { applied } = await io.output.task("Applying migrations", () =>
      this.runner.migrate({
        cwd: this.cwd,
        environment: environment,
        ...(release === undefined ? {} : { release }),
      }),
    );
    if (applied.length === 0) io.output.info("Nothing to migrate");
    else io.output.list(applied);
    return { applied };
  }
}
