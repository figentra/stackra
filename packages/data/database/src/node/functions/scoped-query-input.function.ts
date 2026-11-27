/**
 * Stackra file contract:
 * Purpose: `scopedQueryInput(query)`, the checked form of a `ScopedQuery`: the query text trimmed of trailing `;`, a
 *          tenant id and an optional role of the allowed spelling, and the row limit and statement timeout with their
 *          defaults, each inside `INSPECTION_LIMITS`. A query that calls `set_config` is refused, since it could change
 *          the tenant or the role it runs as.
 * Boundary: pure; it reads no database. It is not the guard against writes (the read-only transaction is) or against
 *           a second statement (the extended protocol is); it only turns a bad input into a message naming the fix.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (point 1: the tenant comes from the caller's
 *                     context, here an explicit one); STA-2906.
 */
import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { INSPECTION_LIMITS } from "#node/constants/inspection-limits.constant";
import type { ScopedQuery } from "#node/types/scoped-query.type";

/** A tenant id: a public id (`scp_01j…`), a uuid or a test key; never quotes, spaces or a separator. */
const SCOPE_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,62}$/;

/** A role name as Postgres prints it unquoted, plus `-` (Encore's local roles, such as `encore-admin`). */
const ROLE = /^[A-Za-z_][A-Za-z0-9_$-]{0,62}$/;

/** A call that changes a setting, the tenant and the role included. */
const SET_CONFIG = /\bset_config\s*\(/i;

/**
 * The checked query.
 *
 * @throws InspectionRefusedError naming the first input out of bounds.
 * @example
 * scopedQueryInput({ sql: "select * from notes.notes;", scope: "scp_01jab3k4m5n6p7q8r9s0t1v2w3" });
 * // { sql: "select * from notes.notes", scope: "scp_…", role: undefined, limit: 100, timeoutMs: 5000 }
 */
export function scopedQueryInput(query: ScopedQuery): {
  readonly sql: string;
  readonly scope: string;
  readonly role: string | undefined;
  readonly limit: number;
  readonly timeoutMs: number;
} {
  const sql = query.sql.trim().replace(/[\s;]+$/, "");
  if (sql === "")
    throw new InspectionRefusedError("the query is empty", "Pass one SELECT statement");
  if (sql.length > INSPECTION_LIMITS.maxSqlLength)
    throw new InspectionRefusedError(
      `the query is longer than ${INSPECTION_LIMITS.maxSqlLength} characters`,
    );
  if (SET_CONFIG.test(sql))
    throw new InspectionRefusedError(
      "the query calls set_config, which could change the tenant or the role it reads as",
      "Pass the tenant (and the role) as options instead",
    );
  if (!SCOPE_ID.test(query.scope))
    throw new InspectionRefusedError(
      `"${query.scope}" is not a tenant id`,
      "Pass the tenant's id, such as scp_01jab3k4m5n6p7q8r9s0t1v2w3",
    );
  if (query.role !== undefined && query.role !== "" && !ROLE.test(query.role))
    throw new InspectionRefusedError(`"${query.role}" is not a role name`);
  const limit = query.limit ?? INSPECTION_LIMITS.defaultRows;
  if (!Number.isInteger(limit) || limit < 1 || limit > INSPECTION_LIMITS.maxRows)
    throw new InspectionRefusedError(`the limit is 1 to ${INSPECTION_LIMITS.maxRows} rows`);
  const timeoutMs = query.timeoutMs ?? INSPECTION_LIMITS.defaultTimeoutMs;
  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < INSPECTION_LIMITS.minTimeoutMs ||
    timeoutMs > INSPECTION_LIMITS.maxTimeoutMs
  )
    throw new InspectionRefusedError(
      `the timeout is ${INSPECTION_LIMITS.minTimeoutMs} to ${INSPECTION_LIMITS.maxTimeoutMs} milliseconds`,
    );
  return {
    sql,
    scope: query.scope,
    role: query.role === "" ? undefined : query.role,
    limit,
    timeoutMs,
  };
}
