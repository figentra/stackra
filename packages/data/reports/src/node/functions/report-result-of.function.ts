/**
 * Stackra file contract:
 * Purpose: `reportResultOf(plan, declaration, rows, maxRows)`, the `ReportResult` of one report statement's rows: the
 *          page's groups, the grand totals (the grouping-sets total row), and the next page's cursor. It applies the
 *          mixed-currency guard: a group or the total whose money measure spans two currencies refuses the run.
 * Boundary: internal; pure. Counts and numeric aggregates (Postgres sends `numeric` and `bigint` as text) become numbers;
 *           a money measure is `{ minor, currency }`; a time bucket is an ISO instant. The statement reads one group past
 *           the page, which says whether there is a next page; the cursor stops at the row cap.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3: `ReportResult`); ADR 0307 (rule 16: money never mixes currencies).
 */
import type { Json } from "@stackra/contracts";
import { MixedCurrencyError } from "@stackra/database";

import type { ReportDeclaration } from "#core/types/report-declaration.type";
import type { ReportResult } from "#core/types/report-result.type";
import { PAGE_CURSOR } from "#node/constants/page-cursor.constant";
import type { ReportPlan } from "#node/types/report-plan.type";

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
 * @example
 * reportResultOf(plan, declaration, await em.execute(text, params), config.maxRows);
 */
export function reportResultOf(
  plan: ReportPlan,
  declaration: ReportDeclaration,
  rows: readonly Readonly<Record<string, unknown>>[],
  maxRows: number,
): ReportResult {
  for (const row of rows)
    for (const name of plan.money)
      if (Number(row[`${name}~currencies`] ?? 0) > 1) {
        const field = String(declaration.measures[name]?.field ?? name).replace(/\.minor$/, "");
        throw MixedCurrencyError.create({ field: `${field}.minor` });
      }
  const valuesOf = (row: Readonly<Record<string, unknown>>, withDimensions: boolean) => {
    const values: Record<string, Json> = {};
    if (withDimensions) for (const name of plan.dimensions) values[name] = jsonOf(row[name]);
    for (const name of plan.measures)
      values[name] = plan.moneyOut.includes(name)
        ? { minor: numberOf(row[name]) ?? 0, currency: jsonOf(row[`${name}~currency`]) }
        : numberOf(row[name]);
    return values;
  };
  if (plan.dimensions.length === 0) {
    const [row = {}] = rows;
    return { rows: [valuesOf(row, false)], totals: valuesOf(row, false), cursor: null };
  }
  const total = rows.find((row) => Number(row["~grouping"]) !== 0) ?? {};
  const groups = rows.filter((row) => Number(row["~grouping"]) === 0);
  const next = plan.offset + plan.limit;
  return {
    rows: groups.slice(0, plan.limit).map((row) => valuesOf(row, true)),
    totals: valuesOf(total, false),
    cursor: groups.length > plan.limit && next < maxRows ? PAGE_CURSOR.encode(next) : null,
  };
}
