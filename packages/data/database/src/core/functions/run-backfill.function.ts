/**
 * Stackra file contract:
 * Purpose: `runBackfill(type, session, options)`, the backfill runner: walks the backfill's table by its keyset column
 *          in batches of the rows still `pending` past the ledger's cursor, fills each batch (`set`, or the class's
 *          `apply`) and moves the cursor in the same transaction, pauses between batches, and returns its progress.
 *          A queue job calls it with `maxBatches` and queues itself again until `finished` (ADR 0159 d3).
 * Boundary: runs on the session it is given (`backfill` opens one in node). Each batch runs with `row_security` off
 *           (transaction-local), so it reads every tenant's rows or fails: a role that row-level security would filter
 *           (a `FORCE` table, a role neither superuser nor `BYPASSRLS`) gets SQLSTATE 42501 on its first batch, never
 *           an empty batch reported as finished. Each batch locks its ledger row first, so
 *           two workers on one backfill take turns and never fill the same batch twice; a crash loses at most the
 *           batch in flight, which rolls back with its cursor. A failed batch records its SQLSTATE or error class in
 *           the ledger, never its message (which can quote row values), and the error is rethrown. SQL is built from
 *           the declaration's literals and quoted keys, never from input.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, batched and resumable); ADR 0334 (rule 4); ADR
 *                     0239 (FORCE row security on every tenant table).
 */
import { kindOf } from "@stackra/container";

import type { BackfillBase } from "#core/bases/backfill-base.base";
import { BACKFILL_LEDGER } from "#core/constants/backfill-ledger.constant";
import { quoteIdentifier } from "#core/functions/quote-identifier.function";
import { sqlLiteral } from "#core/functions/sql-literal.function";
import type { BackfillClass } from "#core/types/backfill-class.type";
import type { BackfillProgress } from "#core/types/backfill-progress.type";
import type { BackfillQuery } from "#core/types/backfill-query.type";
import type { BackfillSession } from "#core/types/backfill-session.type";
import type { RunBackfillOptions } from "#core/types/run-backfill-options.type";

/** The checked declaration `Backfill({ ... })` recorded. */
interface Declared {
  readonly key: string;
  readonly schema: string;
  readonly table: string;
  readonly by: string;
  readonly pending: string;
  readonly set: string | undefined;
  readonly batch: number;
  readonly pause: number;
}

/** A keyset value as a SQL literal: a number or bigint as written, anything else as quoted text. */
function keyLiteral(value: unknown): string {
  if (typeof value === "number" || typeof value === "bigint") return String(value);
  return sqlLiteral(typeof value === "string" ? value : String(value));
}

/** The ledger row of `key` as progress. */
function progressOf(key: string, row: Record<string, unknown> | undefined): BackfillProgress {
  const cursor = row?.["last_key"];
  return {
    key,
    rows: Number(row?.["rows_done"] ?? 0),
    batches: Number(row?.["batches"] ?? 0),
    cursor: cursor === null || cursor === undefined ? null : String(cursor),
    finished: row?.["finished_at"] !== null && row?.["finished_at"] !== undefined,
  };
}

/** The SQLSTATE of a database error, else its class name: never its message. */
function errorCode(error: unknown): string {
  const code = (error as { readonly code?: unknown } | null)?.code;
  if (typeof code === "string" && code !== "") return code;
  return error instanceof Error ? error.name : "Error";
}

/** Waits `ms` milliseconds. */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Runs `type` on `session` until it reaches the end, `maxBatches` batches commit, or `signal` aborts.
 *
 * @throws TypeError when `type` is not a backfill; any error of a batch, after recording its code in the ledger.
 * @example
 * const { finished } = await runBackfill(FillOrderTotalsBackfill, session, { maxBatches: 100 });
 */
export async function runBackfill(
  type: BackfillClass,
  session: BackfillSession,
  options: RunBackfillOptions = {},
): Promise<BackfillProgress> {
  const kind = kindOf(type);
  if (kind?.kind !== "backfill") throw new TypeError(`${type.name} does not extend Backfill`);
  const declared = kind.options as unknown as Declared;
  const instance = Reflect.construct(type, []) as BackfillBase;
  const key = sqlLiteral(declared.key);
  const table = `${quoteIdentifier(declared.schema)}.${quoteIdentifier(declared.table)}`;
  const by = quoteIdentifier(declared.by);
  const ledgerRow = `select last_key, rows_done, batches, finished_at from ${BACKFILL_LEDGER} where key = ${key}`;
  await session.query(
    `insert into ${BACKFILL_LEDGER} (key) values (${key}) on conflict (key) do nothing`,
  );
  if (options.restart === true)
    await session.query(
      `update ${BACKFILL_LEDGER} set last_key = null, finished_at = null, updated_at = now() where key = ${key}`,
    );
  const sleep = options.sleep ?? wait;
  let committed = 0;
  for (;;) {
    if (options.signal?.aborted === true) break;
    let filled: number;
    try {
      filled = await session.transaction(fillBatch);
    } catch (error) {
      await session.query(
        `update ${BACKFILL_LEDGER} set last_error = ${sqlLiteral(errorCode(error))}, updated_at = now() where key = ${key}`,
      );
      throw error;
    }
    if (filled > 0) {
      committed += 1;
      options.onBatch?.(progressOf(declared.key, (await session.query(ledgerRow))[0]));
    }
    if (filled < declared.batch) break;
    if (options.maxBatches !== undefined && committed >= options.maxBatches) break;
    if (declared.pause > 0) await sleep(declared.pause);
  }
  return progressOf(declared.key, (await session.query(ledgerRow))[0]);

  /** One batch in its transaction: lock the ledger row, take the next pending rows, fill them, move the cursor. */
  async function fillBatch(query: BackfillQuery): Promise<number> {
    const { pending, set, batch } = declared;
    // raw-sql: off makes Postgres raise rather than filter, so a role row security would cut never sees "no rows left"
    await query("select set_config('row_security', 'off', true)");
    const [row] = await query(
      `select last_key from ${BACKFILL_LEDGER} where key = ${key} for update`,
    );
    const cursor = row?.["last_key"];
    const past =
      cursor === null || cursor === undefined ? "" : ` and ${by} > ${keyLiteral(cursor)}`;
    const rows = await query(
      `select ${by} as key from ${table} where (${pending})${past} order by ${by} limit ${batch}`,
    );
    const keys = rows.map((found) => found["key"]);
    const last = keys.at(-1);
    const done = keys.length < batch ? "now()" : "null";
    if (keys.length > 0) {
      const where = `${by} in (${keys.map(keyLiteral).join(", ")})`;
      if (set !== undefined) await query(`update ${table} set ${set} where ${where}`);
      else await instance.apply({ keys, where, execute: query });
    }
    await query(
      `update ${BACKFILL_LEDGER} set ${last === undefined ? "" : `last_key = ${keyLiteral(last)}, `}rows_done = rows_done + ${keys.length}, batches = batches + ${keys.length > 0 ? 1 : 0}, finished_at = ${done}, last_error = null, updated_at = now() where key = ${key}`,
    );
    return keys.length;
  }
}
