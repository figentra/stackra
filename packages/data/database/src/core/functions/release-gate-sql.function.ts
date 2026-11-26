/**
 * Stackra file contract:
 * Purpose: `releaseGateSql(after, step)`, the release gate of a contract step (ADR 0159 decision 3: a destructive step
 *          ships in a later release than the change that made it safe): a `DO` block that refuses the migration while
 *          the migration `after` was applied by this same `stackra db migrate` run, or not at all.
 * Boundary: pure SQL text. It reads the runner's ledger (`schema_migrations_history`) and `MIGRATE_FROM_VERSION_SETTING`,
 *           which the runner sets to the version it started from in a forward-only environment. It passes where there
 *           is no older release to protect: no ledger table (Encore's runner on dev and staging, PGlite and
 *           `usePostgres` tests), the setting unset (a rollback environment) or `0` (a fresh database). It has no blank
 *           line, so a runner that splits a step on blank lines keeps it whole, and it undoes nothing.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; the 2026-10-24 note: `stackra db migrate` is the release step, and
 *                     `schema_migrations_history`).
 */
import { MIGRATE_FROM_VERSION_SETTING } from "#core/constants/migrate-from-version-setting.constant";
import { MIGRATION_ID_PATTERN } from "#core/constants/migration-id-pattern.constant";
import { sqlLiteral } from "#core/functions/sql-literal.function";

/**
 * The gate of the contract step `step` (`orders.orders drop column note`), after the migration `after`.
 *
 * @throws TypeError when `after` is not a migration id.
 * @example
 * releaseGateSql("orders.0007_stop_writing_note", "orders.orders drop column note");
 * // 'do $$\ndeclare\n  applied bigint;\n...'
 */
export function releaseGateSql(after: string, step: string): string {
  if (typeof after !== "string" || !MIGRATION_ID_PATTERN.test(after))
    throw new TypeError(
      `${step}: { after } names the migration that shipped the earlier release, such as "orders.0007_stop_writing_note", got ${JSON.stringify(after)}`,
    );
  // gen names a step file `<seq>_<module>_<NNNN>_<stem>[_<n>]`; the id holds only [a-z0-9_.], so it needs no escape.
  const file = `^[0-9]+_${after.replace(".", "_")}(_[0-9]+)?$`;
  return [
    "do $$",
    "declare",
    "  applied bigint;",
    `  since text := nullif(current_setting(${sqlLiteral(MIGRATE_FROM_VERSION_SETTING)}, true), '');`,
    "begin",
    "  if to_regclass('schema_migrations_history') is null or since is null or since = '0' then",
    "    return;",
    "  end if;",
    `  select max(version) into applied from schema_migrations_history where name ~ ${sqlLiteral(file)};`,
    "  if applied is null or applied > since::bigint then",
    `    raise exception 'refused before any change: % is a contract step after %, which this run applies; ship it in a later release', ${sqlLiteral(step)}, ${sqlLiteral(after)};`,
    "  end if;",
    "end",
    "$$",
  ].join("\n");
}
