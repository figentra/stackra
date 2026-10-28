/**
 * Stackra file contract:
 * Purpose: `tableCount`, the count behind `table(input, { count })`: an exact `count(*)`, or for `Count.Estimated` a
 *          count that stops at the cap plus one row and, past the cap, the planner's row estimate (`explain`).
 * Boundary: reads only, through the ORM's query builder with the entity manager's filters applied (the hidden
 *           deleted and archived rows stay hidden), so `filter` is the same typed condition the page reads; the
 *           capped count and the estimate wrap the builder's own parameterised statement.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 12); ADR 0160 (parameterised SQL); reporting gap 6.
 */
import { raw } from "@mikro-orm/core";
import type { FilterQuery } from "@mikro-orm/core";
import type { EntityManager, QBFilterQuery } from "@mikro-orm/postgresql";
import type { AnyClass } from "@stackra/container";

import { BULK_LIMITS } from "#core/constants/bulk-limits.constant";
import { Count } from "#core/enums/count.enum";
import type { TableCount } from "#core/types/table-count.type";

/** The planner's top row estimate in an `explain (format json)` answer. */
function planRows(answer: unknown): number {
  const row = answer as Record<string, unknown> | undefined;
  const plan = (row?.["QUERY PLAN"] ?? []) as readonly {
    readonly Plan?: { "Plan Rows"?: number };
  }[];
  return Math.round(Number(plan[0]?.Plan?.["Plan Rows"] ?? 0));
}

/**
 * Counts the rows of `model` matching `filter`.
 *
 * @param cap - the most rows an estimated count counts exactly; `BULK_LIMITS.countCap` by default.
 * @example
 * await tableCount(em, Order, { status: "paid" }, Count.Estimated); // { value: 10000, capped: true, estimate: 48210 }
 */
export async function tableCount<M extends object>(
  em: EntityManager,
  model: AnyClass<M>,
  filter: FilterQuery<M>,
  mode: Count,
  cap: number = BULK_LIMITS.countCap,
): Promise<TableCount> {
  const builder = em.createQueryBuilder(model, "row").where(filter as QBFilterQuery<M>);
  await builder.applyFilters();
  if (mode === Count.Exact) return { value: await builder.getCount(), capped: false };
  const { sql, params } = builder
    .select(raw("1"))
    .limit(cap + 1)
    .toQuery();
  // raw-sql: a count over a limited subquery stops reading at the cap; the inner statement is the builder's own
  const row = await em.execute<Record<string, unknown>>(
    `select count(*) as total from (${sql}) as capped`,
    [...params],
    "get",
  );
  const value = Number(row?.["total"] ?? 0);
  if (value <= cap) return { value, capped: false };
  const { sql: all, params: allParams } = builder.limit(undefined).toQuery();
  // raw-sql: the planner's estimate of the uncapped statement; `explain` without `analyze` runs nothing
  const estimate = planRows(
    await em.execute(`explain (format json) ${all}`, [...allParams], "get"),
  );
  return { value: cap, capped: true, estimate: Math.max(estimate, cap + 1) };
}
