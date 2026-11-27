/**
 * Stackra file contract:
 * Purpose: `DbMigrationsStatusCommand`, `stackra db:migrations:status [--member <folder>]`, also the
 *          `db_migrations_status` tool of the local developer MCP: each compiled migration file of the member with
 *          whether it is applied and whether it was edited after it ran, the recorded version and dirty flag, and the
 *          applied versions no file holds any more.
 * Boundary: reads only, through the member's own `@stackra/database/node` (`migrationStatus`): no advisory lock, no
 *           bookkeeping table created, so it reads a database Encore migrated as it is. Local dev and the testbed only.
 *           The connection comes from `inspectionSetup`, never from an argument. `stackra db migrate` applies.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 2 as amended: the compiled stream); ADR 0282 (decision 5); STA-2906.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { inspectionSetup } from "#node/functions/inspection-setup.function";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

/** Shows which migrations are applied, pending or edited. */
export class DbMigrationsStatusCommand extends Command({
  name: "db:migrations:status",
  description:
    "Show which compiled migrations are applied, pending or edited since they ran, without writing (local dev and testbed only)",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The member's folder. */
  @Option({ description: "The service's folder, such as services/notes (default: this folder)" })
  @Str
  member = ".";

  /** Reads the state and returns it. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const { cwd, env } = await inspectionSetup(io, this.member);
    const status = await (await loadDatabaseInspector(cwd)).migrationStatus({ cwd, env });
    io.output.keyValue({
      Version: status.version,
      Dirty: status.dirty ? "yes" : "no",
      Pending: status.pending,
    });
    io.output.table(
      ["Migration", "Applied", "Edited"],
      status.migrations.map((migration) => [
        migration.name,
        migration.applied ? "yes" : "no",
        migration.edited ? "yes" : "",
      ]),
    );
    return { ...status };
  }
}
