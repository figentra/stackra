/**
 * Stackra file contract:
 * Purpose: `systemAccessRoleSql`, the statement that creates `SYSTEM_ACCESS_ROLE` when the database's cluster does not
 *          have it: `NOLOGIN NOBYPASSRLS`, granted to no one. `t.systemAccess` and `schema.systemFunction` both start
 *          with it, so either can come first.
 * Boundary: internal to the migration compiler. Creating a role needs `CREATEROLE` (or a superuser) on the migrating
 *           user. A down keeps the role, as it keeps an extension: other databases of the cluster may use it.
 * Runtime: node
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A).
 */
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import type { CompiledStatement } from "#core/types/compiled-statement.type";

/**
 * The create-if-missing statement of the system-access role. It has no blank line, so a runner that splits a step on
 * blank lines keeps it whole.
 *
 * @example
 * systemAccessRoleSql().sql; // "do $$\nbegin\n  create role \"stackra_system_access\" nologin nobypassrls;\n..."
 */
export function systemAccessRoleSql(): CompiledStatement {
  return {
    sql: [
      "do $$",
      "begin",
      `  create role ${quoteIdentifier(SYSTEM_ACCESS_ROLE)} nologin nobypassrls;`,
      "exception when duplicate_object then null;",
      "end",
      "$$",
    ].join("\n"),
    inverse: [],
  };
}
