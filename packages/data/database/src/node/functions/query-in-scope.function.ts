/**
 * Stackra file contract:
 * Purpose: `queryInScope(query)`, `stackra db:query` and the `db_query` tool of the local developer MCP: one query
 *          read the way the app reads it: in a READ ONLY transaction, as the app's role (the connection's own, or the
 *          `role` given), with `app.tenant_id` set to an explicit tenant for that transaction only, a statement
 *          timeout, and a row limit. So a table under row-level security answers the tenant's rows, as it does for the
 *          app, instead of none, and nobody has to turn row-level security off to look.
 * Boundary: local dev and the testbed only (`inspectionTarget`). Refuses a role that can bypass row-level security
 *           (a superuser or BYPASSRLS role, or a member of one) or that owns a table whose row-level security is not
 *           forced, since its answer would not be the app's; refuses a query that calls `set_config`. The query runs as
 *           one statement on the extended protocol inside `select * from (…) limit`, so a write, a second statement or
 *           anything but a query expression fails, and the transaction is rolled back whatever happens. Scope-tree
 *           settings (`app.scope_*`) stay unset, which the compiled policies read as no narrower scope.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); `.agents/rules/tenancy.md` (points 1, 2 and 6:
 *                     the tenant is a transaction-local `set_config(…, true)`); ADR 0495; STA-2906.
 */
import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { inspectionTarget } from "#node/functions/inspection-target.function";
import { openInspectionSession } from "#node/functions/open-inspection-session.function";
import { scopedQueryInput } from "#node/functions/scoped-query-input.function";
import type { ScopedQuery } from "#node/types/scoped-query.type";
import type { ScopedQueryResult } from "#node/types/scoped-query-result.type";

/**
 * What the current role could do around row-level security: be, or be a member of, a superuser or BYPASSRLS role; or
 * own (through membership) a table with row-level security that is not forced, which its owner reads unfiltered.
 */
const ROLE_PROBE = `select current_user as role,
  exists (select 1 from pg_roles r where (r.rolsuper or r.rolbypassrls) and pg_has_role(current_user, r.oid, 'MEMBER')) as bypass,
  (select count(*)::int from pg_class c where c.relrowsecurity and not c.relforcerowsecurity
    and pg_has_role(current_user, c.relowner, 'MEMBER')) as owned`;

/**
 * Runs `query.sql` as the app's role under `query.scope`.
 *
 * @throws InspectionRefusedError outside local dev and the testbed, for an input out of bounds, or for a role that
 *         can bypass row-level security.
 * @throws Error with Postgres's message when the query fails (a syntax error, a write in the read-only transaction, a
 *         missing grant, the timeout).
 * @example
 * const { rows } = await queryInScope({ sql: "select * from notes.notes", scope: "scp_01jab3k4m5n6p7q8r9s0t1v2w3" });
 */
export async function queryInScope(query: ScopedQuery): Promise<ScopedQueryResult> {
  const input = scopedQueryInput(query);
  const { url, environment } = inspectionTarget(query.env);
  return openInspectionSession(url, async ({ extended }) => {
    // raw-sql: the role and the tenant are this transaction's settings, as the isolation driver writes them
    if (input.role !== undefined)
      await extended("select set_config('role', $1, true)", [input.role]);
    const [probe] = await extended(ROLE_PROBE, []);
    const role = String(probe?.["role"] ?? "");
    if (probe?.["bypass"] === true)
      throw new InspectionRefusedError(
        `the role ${role} can bypass row-level security, so its answer would not be the app's`,
        input.role === undefined
          ? "Pass the service's runtime role (no BYPASSRLS), such as stackra_app, as the role"
          : "Pass a role without SUPERUSER or BYPASSRLS",
      );
    if (Number(probe?.["owned"] ?? 0) > 0)
      throw new InspectionRefusedError(
        `the role ${role} owns ${String(probe?.["owned"])} tables whose row-level security is not forced, and reads them unfiltered`,
        "Pass the service's runtime role, which owns no table, as the role",
      );
    await extended(
      "select set_config('app.tenant_id', $1, true), set_config('statement_timeout', $2, true)",
      [input.scope, String(input.timeoutMs)],
    );
    // the caller's text stays inside one query expression; newlines keep a trailing `--` comment off the limit
    const rows = await extended(`select * from (\n${input.sql}\n) as stackra_query limit $1`, [
      input.limit + 1,
    ]);
    const kept = rows
      .slice(0, input.limit)
      .map((row) =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key, jsonValue(value)])),
      );
    return {
      environment,
      role,
      scope: input.scope,
      columns: Object.keys(rows[0] ?? {}),
      rows: kept,
      rowCount: kept.length,
      truncated: rows.length > input.limit,
      limit: input.limit,
    };
  });
}

/** A cell as plain JSON: a bigint as its digits, a date as ISO 8601, bytes as `\x` hex; anything else as it is. */
function jsonValue(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (value instanceof Uint8Array) return `\\x${Buffer.from(value).toString("hex")}`;
  if (Array.isArray(value)) return value.map(jsonValue);
  return value;
}
