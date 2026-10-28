/**
 * Stackra file contract:
 * Purpose: unit tests of `tableCount`: an exact count is the builder's `count(*)`; an estimated count wraps the
 *          builder's statement in a count limited to the cap plus one row, reports a count at or under the cap as is,
 *          and past it reports the cap with the planner's estimate from `explain`; the entity manager's filters apply.
 * Boundary: test only; a recording query builder and entity manager stand in for the ORM.
 * Runtime: node (vitest)
 * Governing contract: ADR 0307 (rule 12); ADR 0022; ADR 0269.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Count } from "#core/enums/count.enum";
import { tableCount } from "#core/functions/table-count.function";

class Order extends Model.with(HasPublicId("ord")) {
  status = "paid";
}

/** An entity manager whose `execute` answers `answers` in order. */
function fakeEm(...answers: unknown[]) {
  const limits: (number | undefined)[] = [];
  const builder = {
    where: vi.fn(() => builder),
    applyFilters: vi.fn(async () => undefined),
    getCount: vi.fn(async () => 12),
    select: vi.fn(() => builder),
    limit: vi.fn((limit?: number) => {
      limits.push(limit);
      return builder;
    }),
    toQuery: vi.fn(() => ({
      sql: `select 1 from "order" as "row" where "row"."status" = ?${limits.at(-1) === undefined ? "" : " limit ?"}`,
      params: limits.at(-1) === undefined ? ["paid"] : ["paid", limits.at(-1)],
    })),
  };
  const execute = vi.fn(async (..._args: unknown[]) => answers.shift());
  const em = { createQueryBuilder: vi.fn(() => builder), execute };
  return { em: em as unknown as EntityManager, builder, execute };
}

describe(tableCount, () => {
  it("counts every row for an exact count, with the filters applied", async () => {
    const { em, builder, execute } = fakeEm();
    expect(await tableCount(em, Order, { status: "paid" }, Count.Exact)).toEqual({
      value: 12,
      capped: false,
    });
    expect(builder.where).toHaveBeenCalledWith({ status: "paid" });
    expect(builder.applyFilters).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
  });

  it("reports an estimated count at or under the cap as counted", async () => {
    const { em, execute } = fakeEm({ total: "7" });
    expect(await tableCount(em, Order, { status: "paid" }, Count.Estimated, 10)).toEqual({
      value: 7,
      capped: false,
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(
      'select count(*) as total from (select 1 from "order" as "row" where "row"."status" = ? limit ?) as capped',
      ["paid", 11],
      "get",
    );
  });

  it("caps a count past the cap and adds the planner's estimate", async () => {
    const { em, execute } = fakeEm(
      { total: "11" },
      { "QUERY PLAN": [{ Plan: { "Plan Rows": 48_210 } }] },
    );
    expect(await tableCount(em, Order, { status: "paid" }, Count.Estimated, 10)).toEqual({
      value: 10,
      capped: true,
      estimate: 48_210,
    });
    expect(execute).toHaveBeenLastCalledWith(
      'explain (format json) select 1 from "order" as "row" where "row"."status" = ?',
      ["paid"],
      "get",
    );
  });

  it("never estimates fewer rows than it counted", async () => {
    const { em } = fakeEm({ total: "11" }, { "QUERY PLAN": [{ Plan: { "Plan Rows": 3 } }] });
    expect(await tableCount(em, Order, {}, Count.Estimated, 10)).toMatchObject({ estimate: 11 });
  });
});
