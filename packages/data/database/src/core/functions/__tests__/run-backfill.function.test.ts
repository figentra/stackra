/**
 * Stackra file contract:
 * Purpose: unit tests of `runBackfill` on a real Postgres engine (PGlite) with the ledger of migration
 *          `database.0009_create_backfill_runs`: a `set` backfill fills every pending row in keyset batches and records
 *          its progress; `maxBatches` hands back unfinished and the next run resumes at the cursor; rows written past
 *          the cursor are reached by a later run and `restart` walks from the first row again; an `apply` backfill gets
 *          the batch's keys and predicate; a failed batch rolls back with its cursor and records only its SQLSTATE; the
 *          pause runs between batches; a class of another kind, or one with neither `set` nor `apply`, is refused
 *          (STA-1406).
 * Boundary: test only; an in-memory PGlite stands in for the direct connection `backfill` opens in node.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs, batched and resumable); ADR 0022.
 */
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "@stackra/testing";

import { Backfill } from "#core/bases/backfill.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import { runBackfill } from "#core/functions/run-backfill.function";
import type { BackfillBatch } from "#core/types/backfill-batch.type";
import type { BackfillClass } from "#core/types/backfill-class.type";
import type { BackfillSession } from "#core/types/backfill-session.type";
import { CreateBackfillRunsMigration } from "#node/database/migrations/0009-create-backfill-runs.migration";

/** A PGlite with the ledger and `shop.orders`, five rows whose totals are unset. */
async function database(): Promise<PGlite> {
  const pg = new PGlite();
  const { steps } = compileMigration(CreateBackfillRunsMigration, {
    schema: "database",
    createsSchema: true,
  });
  for (const step of steps) await pg.exec(step.sql.map((statement) => `${statement};\n`).join(""));
  await pg.exec(`
    create schema shop;
    create table shop.orders (id text primary key, subtotal bigint not null, tax bigint not null, total bigint);
    insert into shop.orders select 'ord_' || n, n * 10, n, null from generate_series(1, 5) n;
  `);
  return pg;
}

/** `pg` as a backfill session. */
function sessionOf(pg: PGlite): BackfillSession {
  return {
    query: async (sql) => (await pg.query<Record<string, unknown>>(sql)).rows,
    transaction: (run) =>
      pg.transaction((tx) =>
        run(async (sql) => (await tx.query<Record<string, unknown>>(sql)).rows),
      ),
  };
}

/** The ledger row of `key`. */
const ledgerOf = async (pg: PGlite, key: string) =>
  (
    await pg.query(
      `select last_key, rows_done::int as rows_done, batches, finished_at is not null as finished, last_error from database.backfill_runs where key = '${key}'`,
    )
  ).rows[0];

/** A sleep that returns at once. */
const noSleep = async (): Promise<void> => undefined;

class FillTotalsBackfill extends Backfill({
  key: "shop.fill_totals",
  table: "shop.orders",
  pending: "total is null",
  set: "total = subtotal + tax",
  batch: 2,
  pause: 25,
}) {}

describe(runBackfill, () => {
  it("fills every pending row in keyset batches and records its progress", async () => {
    const pg = await database();
    const pauses: number[] = [];
    const seen: number[] = [];
    const progress = await runBackfill(FillTotalsBackfill, sessionOf(pg), {
      sleep: async (ms) => {
        pauses.push(ms);
      },
      onBatch: (batch) => seen.push(batch.rows),
    });
    expect(progress).toEqual({
      key: "shop.fill_totals",
      rows: 5,
      batches: 3,
      cursor: "ord_5",
      finished: true,
    });
    expect(seen).toEqual([2, 4, 5]);
    // a pause between full batches, none after the last
    expect(pauses).toEqual([25, 25]);
    expect(
      (await pg.query("select total::int as total from shop.orders order by id")).rows,
    ).toEqual([11, 22, 33, 44, 55].map((total) => ({ total })));
    expect(await ledgerOf(pg, "shop.fill_totals")).toEqual({
      last_key: "ord_5",
      rows_done: 5,
      batches: 3,
      finished: true,
      last_error: null,
    });
  });

  it("hands back after maxBatches and resumes at the cursor on the next run", async () => {
    const pg = await database();
    const first = await runBackfill(FillTotalsBackfill, sessionOf(pg), {
      maxBatches: 1,
      sleep: noSleep,
    });
    expect(first).toMatchObject({ rows: 2, batches: 1, cursor: "ord_2", finished: false });
    expect(
      (await pg.query("select count(*)::int as n from shop.orders where total is null")).rows,
    ).toEqual([{ n: 3 }]);
    const second = await runBackfill(FillTotalsBackfill, sessionOf(pg), { sleep: noSleep });
    expect(second).toMatchObject({ rows: 5, batches: 3, cursor: "ord_5", finished: true });
  });

  it("reaches rows written past the cursor on a later run, and walks from the start on restart", async () => {
    const pg = await database();
    await runBackfill(FillTotalsBackfill, sessionOf(pg), { sleep: noSleep });
    // the release before the expand still writes rows without a total: one past the cursor, one behind it
    await pg.exec(
      "insert into shop.orders values ('ord_6', 60, 6, null); update shop.orders set total = null where id = 'ord_1'",
    );
    const later = await runBackfill(FillTotalsBackfill, sessionOf(pg), { sleep: noSleep });
    expect(later).toMatchObject({ rows: 6, cursor: "ord_6", finished: true });
    expect((await pg.query("select id from shop.orders where total is null")).rows).toEqual([
      { id: "ord_1" },
    ]);
    const restarted = await runBackfill(FillTotalsBackfill, sessionOf(pg), {
      restart: true,
      sleep: noSleep,
    });
    expect(restarted).toMatchObject({ rows: 7, finished: true });
    expect(
      (await pg.query("select count(*)::int as n from shop.orders where total is null")).rows,
    ).toEqual([{ n: 0 }]);
  });

  it("hands an apply backfill the batch's keys and a predicate selecting them", async () => {
    const pg = await database();
    const batches: (readonly unknown[])[] = [];
    class TaxOnlyBackfill extends Backfill({
      key: "shop.tax_only",
      table: "shop.orders",
      pending: "total is null",
      batch: 3,
    }) {
      override async apply(batch: BackfillBatch): Promise<void> {
        batches.push(batch.keys);
        await batch.execute(`update shop.orders set total = tax where ${batch.where}`);
      }
    }
    await runBackfill(TaxOnlyBackfill, sessionOf(pg));
    expect(batches).toEqual([
      ["ord_1", "ord_2", "ord_3"],
      ["ord_4", "ord_5"],
    ]);
    expect(
      (await pg.query("select total::int as total from shop.orders order by id")).rows,
    ).toEqual([1, 2, 3, 4, 5].map((total) => ({ total })));
  });

  it("rolls a failed batch back with its cursor and records only its SQLSTATE", async () => {
    const pg = await database();
    await pg.exec("update shop.orders set tax = -1 where id = 'ord_3'");
    class CheckedBackfill extends Backfill({
      key: "shop.checked",
      table: "shop.orders",
      pending: "total is null",
      set: "total = (subtotal / greatest(tax, 0))::bigint",
      batch: 2,
    }) {}
    await expect(runBackfill(CheckedBackfill, sessionOf(pg))).rejects.toThrow(/division by zero/);
    expect(await ledgerOf(pg, "shop.checked")).toEqual({
      last_key: "ord_2",
      rows_done: 2,
      batches: 1,
      finished: false,
      last_error: "22012",
    });
    expect(
      (await pg.query("select id from shop.orders where total is null order by id")).rows,
    ).toEqual([{ id: "ord_3" }, { id: "ord_4" }, { id: "ord_5" }]);
  });

  it("stops before the next batch once its signal aborts", async () => {
    const pg = await database();
    const controller = new AbortController();
    const progress = await runBackfill(FillTotalsBackfill, sessionOf(pg), {
      signal: controller.signal,
      onBatch: () => controller.abort(),
      sleep: noSleep,
    });
    expect(progress).toMatchObject({ rows: 2, batches: 1, finished: false });
  });

  it("refuses a class of another kind, and a backfill with neither set nor apply", async () => {
    const pg = await database();
    class NotBackfill {}
    await expect(
      runBackfill(NotBackfill as unknown as BackfillClass, sessionOf(pg)),
    ).rejects.toThrow(/does not extend Backfill/);
    class EmptyBackfill extends Backfill({
      key: "shop.empty",
      table: "shop.orders",
      pending: "total is null",
    }) {}
    await expect(runBackfill(EmptyBackfill, sessionOf(pg))).rejects.toThrow(
      /declares no set and no apply/,
    );
    expect(await ledgerOf(pg, "shop.empty")).toMatchObject({
      last_error: "TypeError",
      rows_done: 0,
    });
  });
});
