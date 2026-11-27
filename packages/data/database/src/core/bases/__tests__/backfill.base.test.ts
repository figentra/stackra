/**
 * Stackra file contract:
 * Purpose: unit tests of the `Backfill` kind base: the called form records its checked, frozen options with their
 *          defaults, and refuses a bad key, an unqualified table, a column that is not snake_case, SQL that could end its
 *          statement, and a batch or pause out of range (STA-1406).
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0294 (decision 25: kind bases); ADR 0022.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Backfill } from "#core/bases/backfill.base";
import { BackfillBase } from "#core/bases/backfill-base.base";
import type { BackfillOptions } from "#core/types/backfill-options.type";

const base: BackfillOptions = {
  key: "orders.fill_totals",
  table: "orders.orders",
  pending: "total_minor is null",
};

describe("Backfill", () => {
  it("records its options, checked and frozen, with the defaults", () => {
    class FillTotalsBackfill extends Backfill({
      ...base,
      set: " total_minor = 0 ",
    }) {}
    const kind = kindOf(FillTotalsBackfill);
    expect(kind?.kind).toBe("backfill");
    expect(kind?.options).toEqual({
      key: "orders.fill_totals",
      schema: "orders",
      table: "orders",
      by: "id",
      pending: "total_minor is null",
      set: "total_minor = 0",
      batch: 500,
      pause: 0,
    });
    expect(Object.isFrozen(kind?.options)).toBe(true);
    expect(new FillTotalsBackfill()).toBeInstanceOf(BackfillBase);
  });

  it("refuses a bad declaration", () => {
    for (const [change, message] of [
      [{ key: "fill_totals" }, /<module>\.<snake name>/],
      [{ table: "orders" }, /schema-qualified/],
      [{ table: "orders.orders.x" }, /schema-qualified/],
      [{ table: "Orders.orders" }, /database name/],
      [{ by: "Id" }, /database name/],
      [{ pending: "" }, /one line of SQL/],
      [{ pending: "total is null; drop table orders" }, /without ; or \$\$/],
      [{ set: "total = 1\n, x = 2" }, /one line of SQL/],
      [{ batch: 0 }, /batch is a whole number/],
      [{ batch: 10_001 }, /batch is a whole number/],
      [{ pause: -1 }, /pause is whole milliseconds/],
      [{ pause: 1.5 }, /pause is whole milliseconds/],
    ] as const)
      expect(() => Backfill({ ...base, ...change })).toThrow(message);
  });
});
