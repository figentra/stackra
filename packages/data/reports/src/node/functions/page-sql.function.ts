/**
 * Stackra file contract:
 * Purpose: `pageSql(plan, inner)`, the statement that reads one report run's rows from its grouped statement: the
 *          page's groups plus one (to tell whether a next page exists) and the grand total; with subtotals, the subtotal
 *          rows of the page's groups' leading prefixes; for a pivot, every cell and margin up to the row cap plus one.
 * Boundary: internal; pure. `inner` is the query builder's grouped statement and keeps its own bound values; this
 *           function's text holds only aliases of declared names, grouping masks and `?` placeholders, and returns the
 *           values bound after `inner`'s. Ungrouped plans are read as they are.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3: one statement with groups, subtotals, grand totals and a pivot matrix, and a
 *                     row cap); ADR 0160 (parameterised SQL).
 */
import { groupingMask } from "#node/functions/grouping-mask.function";
import type { ReportPlan } from "#node/types/report-plan.type";
import type { SqlFragment } from "#node/types/sql-fragment.type";

/**
 * The paged statement of `plan` over `inner`.
 *
 * @example
 * const { sql, params } = pageSql(plan, qb.toQuery().sql);
 * await em.execute(sql, [...inner.params, ...params], "all");
 */
export function pageSql(plan: ReportPlan, inner: string): SqlFragment {
  if (plan.groupBy === undefined) return { sql: inner, params: [] };
  if (plan.pivot !== undefined)
    return {
      sql: `select * from (${inner}) as "report" where "~rank" <= ? order by "~grouping", "~rank"`,
      params: [plan.limit + 1],
    };
  const window = [plan.offset, plan.offset + plan.limit + 1];
  if (plan.subtotals !== true)
    return {
      sql: `select * from (${inner}) as "report" where "~grouping" <> 0 or ("~rank" > ? and "~rank" <= ?) order by "~grouping", "~rank"`,
      params: window,
    };
  // A subtotal row is kept when a page group shares its leading dimensions (null-safe, as grouping sets keep nulls).
  const { dimensions } = plan;
  const levels = dimensions.slice(1).map((_, index) => {
    const kept = dimensions.slice(0, index + 1);
    const same = kept.map((name) => `"p"."${name}" is not distinct from "r"."${name}"`);
    return `("r"."~grouping" = ${groupingMask(dimensions, kept)} and ${same.join(" and ")})`;
  });
  return {
    sql:
      `with "report" as (${inner}), ` +
      `"page" as (select * from "report" where "~grouping" = 0 and "~rank" > ? and "~rank" <= ?) ` +
      `select * from "page" union all select "r".* from "report" as "r" where "r"."~grouping" = ${groupingMask(dimensions, [])} ` +
      `or exists (select 1 from "page" as "p" where ${levels.join(" or ")}) ` +
      `order by "~grouping", "~rank"`,
    params: window,
  };
}
