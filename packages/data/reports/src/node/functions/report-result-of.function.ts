/**
 * Stackra file contract:
 * Purpose: `reportResultOf(plan, declaration, rows, maxRows)`, the `ReportEngineResult` of one report statement's rows: the
 *          page's groups, the grand totals (the grouping-sets total row), the next page's cursor, the subtotals of the
 *          page's leading prefixes, and the pivot matrix with its row and column totals. It applies the mixed-currency
 *          guard: a group, subtotal, margin or the total whose money measure spans two currencies refuses the run.
 * Boundary: internal; pure. Counts and numeric aggregates (Postgres sends `numeric` and `bigint` as text) become numbers;
 *           a money measure is `{ minor, currency }`; a time bucket is an ISO instant. The statement reads one group past
 *           the page, which says whether there is a next page; the cursor stops at the row cap. Each row's
 *           `"~grouping"` mask (`groupingMask`) says which grouping set it is. A pivot is not paged: more cells than the
 *           row cap refuse the run.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3: `ReportResult`); ADR 0307 (rule 16: money never mixes currencies).
 */
import type { Json } from "@stackra/contracts";
import { MixedCurrencyError } from "@stackra/database";

import type { ReportEngineDeclaration } from "#contracts/types/report-engine-declaration.type";
import type { ReportEngineResult } from "#contracts/types/report-engine-result.type";
import type { ReportEnginePivot } from "#contracts/types/report-engine-pivot.type";
import { PAGE_CURSOR } from "#node/constants/page-cursor.constant";
import { ReportRequestInvalidError } from "#node/errors/report-request-invalid.error";
import { groupingMask } from "#node/functions/grouping-mask.function";
import type { ReportPlan } from "#node/types/report-plan.type";

/** One statement row. */
type Row = Readonly<Record<string, unknown>>;

/** `value` as JSON: an instant as ISO text, a bigint as a number. */
function jsonOf(value: unknown): Json {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  return (value ?? null) as Json;
}

/** A numeric aggregate as a number, null kept. */
function numberOf(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

/**
 * The result of `rows`.
 *
 * @throws MixedCurrencyError when a money measure's rows in one group, or in the whole set, hold two currencies.
 * @throws ReportRequestInvalidError when a pivot has more cells than the row cap.
 * @example
 * reportResultOf(plan, declaration, await em.execute(text, params), config.maxRows);
 */
export function reportResultOf(
  plan: ReportPlan,
  declaration: ReportEngineDeclaration,
  rows: readonly Row[],
  maxRows: number,
): ReportEngineResult {
  for (const row of rows)
    for (const name of plan.money)
      if (Number(row[`${name}~currencies`] ?? 0) > 1) {
        const field = String(declaration.measures[name]?.field ?? name).replace(/\.minor$/, "");
        throw MixedCurrencyError.create({ field: `${field}.minor` });
      }
  const valuesOf = (row: Row, dimensions: readonly string[]): Record<string, Json> => {
    const values: Record<string, Json> = {};
    for (const name of dimensions) values[name] = jsonOf(row[name]);
    for (const name of plan.measures)
      values[name] = plan.moneyOut.includes(name)
        ? { minor: numberOf(row[name]) ?? 0, currency: jsonOf(row[`${name}~currency`]) }
        : numberOf(row[name]);
    return values;
  };
  if (plan.dimensions.length === 0) {
    const [row = {}] = rows;
    return { rows: [valuesOf(row, [])], totals: valuesOf(row, []), cursor: null };
  }
  const { dimensions } = plan;
  const grand = groupingMask(dimensions, []);
  const inSet = (mask: number): Row[] => rows.filter((row) => Number(row["~grouping"]) === mask);
  const [total = {}] = inSet(grand);
  const groups = inSet(0);
  const totals = valuesOf(total, []);

  if (plan.pivot !== undefined) {
    if (groups.length > plan.limit)
      throw ReportRequestInvalidError.create({
        report: plan.report,
        reason: `a pivot reads at most ${plan.limit} cells; narrow the filters`,
      });
    return {
      rows: groups.map((row) => valuesOf(row, dimensions)),
      totals,
      cursor: null,
      pivot: pivotOf(plan.pivot, dimensions, groups, inSet, total, (row) => valuesOf(row, [])),
    };
  }

  const page = groups.slice(0, plan.limit);
  const next = plan.offset + plan.limit;
  const result: ReportEngineResult = {
    rows: page.map((row) => valuesOf(row, dimensions)),
    totals,
    cursor: groups.length > plan.limit && next < maxRows ? PAGE_CURSOR.encode(next) : null,
  };
  if (plan.subtotals !== true) return result;
  // Deepest level first; a subtotal is kept only when a group on this page shares its prefix.
  const subtotals = dimensions.slice(1).flatMap((_, index) => {
    const level = dimensions.length - 1 - index;
    const kept = dimensions.slice(0, level);
    return inSet(groupingMask(dimensions, kept))
      .filter((row) =>
        page.some((group) =>
          kept.every((name) => Object.is(jsonOf(group[name]), jsonOf(row[name]))),
        ),
      )
      .map((row) => ({ level, values: valuesOf(row, kept) }));
  });
  return { ...result, subtotals };
}

/** The pivot matrix of the cell rows `groups`, keyed by the axes' values. */
function pivotOf(
  axes: NonNullable<ReportPlan["pivot"]>,
  dimensions: readonly string[],
  groups: readonly Row[],
  inSet: (mask: number) => Row[],
  total: Row,
  measures: (row: Row) => Record<string, Json>,
): ReportEnginePivot {
  const grand = groupingMask(dimensions, []);
  const keyOf = (row: Row, axis: readonly string[]): Json[] =>
    axis.map((name) => jsonOf(row[name]));
  // An axis with no dimension shares the grand-total set: one empty key whose totals are the grand totals.
  const margin = (axis: readonly string[]): Row[] => {
    const mask = groupingMask(dimensions, axis);
    return mask === grand ? [total] : inSet(mask);
  };
  const rowMargin = margin(axes.rows);
  const columnMargin = margin(axes.columns);
  const rowKeys = rowMargin.map((row) => keyOf(row, axes.rows));
  const columnKeys = columnMargin.map((row) => keyOf(row, axes.columns));
  const cells = new Map(
    groups.map((row) => [
      JSON.stringify([keyOf(row, axes.rows), keyOf(row, axes.columns)]),
      measures(row),
    ]),
  );
  return {
    rows: rowKeys,
    columns: columnKeys,
    cells: rowKeys.map((rowKey) =>
      columnKeys.map((columnKey) => cells.get(JSON.stringify([rowKey, columnKey])) ?? null),
    ),
    rowTotals: rowMargin.map(measures),
    columnTotals: columnMargin.map(measures),
  };
}
