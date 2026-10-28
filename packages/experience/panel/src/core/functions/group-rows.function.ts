/**
 * Stackra file contract:
 * Purpose: `groupRows(rows, view)`, a saved view's grouping of the rows on screen: groups by the view's `group.by`
 *          path in the order each value is first met (so the view's sort holds), sub-groups by `group.then`, and the
 *          view's totals per group.
 * Boundary: pure; over the rows given, so only for an inline relation table that is fully loaded (ADR 0470 decision
 *           4). A paged list or a report reads its groups, subtotals and totals from the server group-by
 *           (`@stackra/reports` `ReportResult`), never from this. A total reads numbers only (amounts in minor units,
 *           one currency per column) except `distinct`, which counts distinct non-null values; other values are
 *           skipped, and a total with no number is `null`. Values are compared with `Object.is`, so `null` and an
 *           absent value form one group.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decision 14); ADR 0307 (rule 13 as reopened); ADR 0470 (decision 4: one `Aggregate`,
 *                     `groupRows` for fully loaded tables only).
 */
import { Aggregate } from "#core/enums/aggregate.enum";
import { valueAt } from "#core/functions/value-at.function";
import type { SavedView } from "#core/schemas/saved-view.schema";
import type { ViewGroup } from "#core/types/view-group.type";

/** The totals of `rows`. */
function totalsOf(
  rows: readonly unknown[],
  totals: SavedView["totals"],
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const { key, aggregate } of totals) {
    const name = `${aggregate}:${key}`;
    if (aggregate === Aggregate.Count) {
      out[name] = rows.length;
      continue;
    }
    if (aggregate === Aggregate.Distinct) {
      out[name] = new Set(
        rows.map((row) => valueAt(row, key)).filter((value) => value != null),
      ).size;
      continue;
    }
    const numbers = rows
      .map((row) => valueAt(row, key))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (numbers.length === 0) out[name] = null;
    else if (aggregate === Aggregate.Sum) out[name] = numbers.reduce((sum, n) => sum + n, 0);
    else if (aggregate === Aggregate.Avg)
      out[name] = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    else if (aggregate === Aggregate.Min) out[name] = Math.min(...numbers);
    else out[name] = Math.max(...numbers);
  }
  return out;
}

/** `rows` split by the value at `path`, in first-met order. */
function split<R>(rows: readonly R[], path: string): [unknown, R[]][] {
  const groups: [unknown, R[]][] = [];
  for (const row of rows) {
    const value = valueAt(row, path) ?? null;
    const group = groups.find(([seen]) => Object.is(seen, value));
    if (group === undefined) groups.push([value, [row]]);
    else group[1].push(row);
  }
  return groups;
}

/**
 * The groups of `rows` under `view`; one group of every row when the view does not group. Only for a fully loaded
 * table: totals over a page are wrong for the full set.
 *
 * @example
 * groupRows(orders, { group: { by: "status" }, totals: [{ key: "totals.totalMinor", aggregate: "sum" }] });
 * // [{ value: "paid", count: 2, totals: { "sum:totals.totalMinor": 5000 }, rows: [...] }, ...]
 */
export function groupRows<R>(
  rows: readonly R[],
  view: Pick<SavedView, "group" | "totals">,
): ViewGroup<R>[] {
  const { totals } = view;
  if (view.group === undefined)
    return [{ value: null, count: rows.length, totals: totalsOf(rows, totals), rows }];
  const { by, then } = view.group;
  return split(rows, by).map(([value, members]) => ({
    value,
    count: members.length,
    totals: totalsOf(members, totals),
    ...(then === undefined
      ? { rows: members }
      : {
          groups: split(members, then).map(([sub, inner]) => ({
            value: sub,
            count: inner.length,
            totals: totalsOf(inner, totals),
            rows: inner,
          })),
        }),
  }));
}
