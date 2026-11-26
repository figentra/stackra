/**
 * Stackra file contract:
 * Purpose: `pendingRowsGateSql(qualified, pending, refusal)`, the data gate of a contract step: a `DO` block that refuses
 *          the migration while any row of the table still meets `pending` (a backfill has not reached it), naming how
 *          many (up to 1000) and what to do.
 * Boundary: pure SQL text over literals the migration wrote. It counts with `row_security` off for its own statement
 *           (restored after), so it reads every tenant's rows or fails: a role that row-level security would filter
 *           (a `FORCE` table, a role neither superuser nor `BYPASSRLS`) gets a refusal naming the table, never a count
 *           of the rows its policy happens to show, which would let a drop through with rows still to copy. It has no
 *           blank line, so a runner that splits a step on blank lines keeps it whole, and it undoes nothing. A fresh
 *           database has no rows, so it passes there.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, before the contract step); ADR 0239 (FORCE row
 *                     security on every tenant table).
 */
import { sqlLiteral } from "#core/functions/sql-literal.function";

/** How many pending rows the gate counts before it stops counting. */
const COUNT_LIMIT = 1000;

/**
 * The gate over `qualified` for rows meeting `pending`.
 *
 * @param qualified - the quoted, schema-qualified table.
 * @param pending - SQL over the table's columns, true for a row the backfill has not reached.
 * @param refusal - the refusal's subject and remedy, one sentence.
 * @throws TypeError for a blank or multi-line predicate, or one holding `$$`.
 * @example
 * pendingRowsGateSql('"orders"."orders"', '"total_minor" is null', "orders.fill_totals has not finished");
 */
export function pendingRowsGateSql(qualified: string, pending: string, refusal: string): string {
  if (typeof pending !== "string" || pending.trim() === "" || /[\r\n]|\$\$/.test(pending))
    throw new TypeError("A pending predicate is one line of SQL without $$");
  return [
    "do $$",
    "declare",
    "  n bigint;",
    "  security text := current_setting('row_security');",
    "begin",
    "  begin",
    // row_security off makes Postgres raise rather than filter: a count that RLS would cut is no count at all
    "    perform set_config('row_security', 'off', true);",
    `    select count(*) into n from (select 1 from ${qualified} where ${pending} limit ${COUNT_LIMIT + 1}) pending;`,
    "    perform set_config('row_security', security, true);",
    "  exception when insufficient_privilege then",
    `    raise exception 'refused before any change: % hides rows from role % under row-level security, so its pending rows cannot be counted (%): run the migration as a role that bypasses row security (a superuser or BYPASSRLS, DATABASE_DIRECT_URL)', ${sqlLiteral(qualified)}, current_user, sqlerrm;`,
    "  end;",
    "  if n > 0 then",
    `    raise exception 'refused before any change: % rows of % still match %: %', case when n > ${COUNT_LIMIT} then 'more than ${COUNT_LIMIT}' else n::text end, ${sqlLiteral(qualified)}, ${sqlLiteral(pending)}, ${sqlLiteral(refusal)};`,
    "  end if;",
    "end",
    "$$",
  ].join("\n");
}
