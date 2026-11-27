/**
 * Stackra file contract:
 * Purpose: `DbSchemaCommand`, `stackra db:schema [--member <folder>] [--schema <name>] [--table <name>]`, also the
 *          `db_schema` tool of the local developer MCP: the member's tables with their columns, primary key, indexes,
 *          row-level security (enabled, forced) and policies, one row per table on a terminal, the whole description
 *          under `--json` and as the tool's result.
 * Boundary: reads the catalogue only, through the member's own `@stackra/database/node` (`describeSchema`), in a
 *           read-only transaction; local dev and the testbed only, refused anywhere else. The connection comes from
 *           `inspectionSetup` (the environment, else the local Encore database), never from an argument.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); `.agents/rules/tenancy.md` (point 2);
 *                     STA-2906.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { inspectionSetup } from "#node/functions/inspection-setup.function";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

/** Describes the member's tables. */
export class DbSchemaCommand extends Command({
  name: "db:schema",
  description:
    "Show the member's tables: columns, keys, indexes, row-level security and policies (local dev and testbed only)",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The member's folder. */
  @Option({ description: "The service's folder, such as services/notes (default: this folder)" })
  @Str
  member = ".";

  /** Only this schema. */
  @Option({ description: "Only the tables of this schema" })
  @Str
  schema = "";

  /** Only this table. */
  @Option({ description: "Only the table of this name" })
  @Str
  table = "";

  /** Reads the catalogue and returns the description. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const { cwd, env } = await inspectionSetup(io, this.member);
    const description = await (
      await loadDatabaseInspector(cwd)
    ).describeSchema({
      schema: this.schema || undefined,
      table: this.table || undefined,
      env,
    });
    io.output.keyValue({ Environment: description.environment, Role: description.role });
    io.output.table(
      ["Table", "Row security", "Policies", "Columns"],
      description.tables.map((table) => [
        `${table.schema}.${table.name}`,
        table.rowSecurity.forced ? "forced" : table.rowSecurity.enabled ? "enabled" : "off",
        String(table.policies.length),
        String(table.columns.length),
      ]),
    );
    return { ...description };
  }
}
