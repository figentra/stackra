/**
 * Stackra file contract:
 * Purpose: `DbQueryCommand`, `stackra db:query <tenant> <sql> [--member <folder>] [--role <role>] [--limit <rows>]
 *          [--timeout <ms>]`, also the `db_query` tool of the local developer MCP: one query read the way the app reads
 *          it (as the app's role, under the tenant given, in a READ ONLY transaction, with a row limit and a statement
 *          timeout), so a table under row-level security answers that tenant's rows instead of none. A table of the
 *          rows on a terminal; the columns, rows, role, tenant and whether the limit cut them under `--json` and as
 *          the tool's result.
 * Boundary: runs through the member's own `@stackra/database/node` (`queryInScope`), which refuses a role that can
 *           bypass row-level security, any write or second statement, and any environment but local dev and the
 *           testbed. The tenant is an explicit argument because a developer tool has no signed-in caller; it never
 *           turns row-level security off. The connection comes from `inspectionSetup`, never from an argument.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); `.agents/rules/tenancy.md` (points 1 and 2);
 *                     STA-2906.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Int, Str } from "@stackra/validation";

import { inspectionSetup } from "#node/functions/inspection-setup.function";
import { loadDatabaseInspector } from "#node/functions/load-database-inspector.function";

/** A cell as one table line. */
const cell = (value: unknown): string =>
  value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

/** Reads one query as the app under a tenant. */
export class DbQueryCommand extends Command({
  name: "db:query",
  description:
    "Run one read-only SELECT as the app's role under a tenant, so row-level security answers that tenant's rows (local dev and testbed only)",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The tenant the policies compare with. */
  @Argument({
    description: "The tenant's id (app.tenant_id), such as scp_01jab3k4m5n6p7q8r9s0t1v2w3",
  })
  scope!: string;

  /** The query. */
  @Argument({ description: "One SELECT (or WITH … SELECT, VALUES, TABLE) statement" })
  sql!: string;

  /** The member's folder. */
  @Option({ description: "The service's folder, such as services/notes (default: this folder)" })
  @Str
  member = ".";

  /** The role to read as when the connection's own can bypass row-level security. */
  @Option({
    description:
      "The app's runtime role to read as, when the connection's role can bypass row-level security (default: the connection's)",
  })
  @Str
  role = "";

  /** The most rows. */
  @Option({ description: "The most rows to return" })
  @Int({
    min: 1,
    max: 1000,
  })
  limit = 100;

  /** The statement timeout. */
  @Option({ description: "The statement timeout in milliseconds" })
  @Int({
    min: 100,
    max: 30_000,
  })
  timeout = 5000;

  /** Runs the query and returns its rows. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const { cwd, env } = await inspectionSetup(io, this.member);
    const result = await (
      await loadDatabaseInspector(cwd)
    ).queryInScope({
      sql: this.sql,
      scope: this.scope,
      role: this.role || undefined,
      limit: this.limit,
      timeoutMs: this.timeout,
      env,
    });
    io.output.info(
      `db query as ${result.role} under ${result.scope}: ${result.rowCount} row${result.rowCount === 1 ? "" : "s"}${result.truncated ? ` (cut at ${this.limit})` : ""}`,
    );
    if (result.columns.length > 0)
      io.output.table(
        [...result.columns],
        result.rows.map((row) => result.columns.map((column) => cell(row[column]))),
      );
    return { ...result };
  }
}
