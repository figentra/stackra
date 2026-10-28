/**
 * Stackra file contract:
 * Purpose: `hiddenReportColumns(declaration, held)`, the dimensions and measures of a report a caller holding the
 *          permission keys `held` may not see: `@stackra/iam`'s `hiddenColumns` over each column's permission and data
 *          class, plus every formula that reads a hidden measure (its value would reveal it).
 * Boundary: pure apart from `permissionKey`, which reads gen's permission registry. The runner passes the reader's held
 *           keys and drops what this returns; a shared definition's validator (stackra-396) passes its audience's keys
 *           and refuses a share that names any of them.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 6: columns carry visibility); ADR 0341 (data classes); ADR 0307 (rule 10).
 */
import { type ColumnRule, hiddenColumns, type Permission, permissionKey } from "@stackra/iam";

import { formulaNames } from "#core/functions/formula-names.function";
import type { ReportDeclaration } from "#core/types/report-declaration.type";

/** A dimension's or measure's visibility rule, with its permission as a locked key. */
function ruleOf(column: {
  readonly permission?: unknown;
  readonly dataClass?: string;
}): ColumnRule {
  return {
    ...(column.permission === undefined
      ? {}
      : { permission: permissionKey(column.permission as Permission | string) }),
    ...(column.dataClass === undefined ? {} : { dataClass: column.dataClass }),
  };
}

/**
 * The names of `declaration`'s columns hidden from a caller who holds `held`.
 *
 * @throws TypeError when a column's permission is a static gen has not registered.
 * @example
 * hiddenReportColumns(OrderSalesReport.declaration, new Set(["orders.order.report"])); // Set { "margin", "marginRate" }
 */
export function hiddenReportColumns(
  declaration: ReportDeclaration,
  held: ReadonlySet<string>,
): Set<string> {
  const columns: Record<string, ColumnRule> = {};
  for (const [name, column] of [
    ...Object.entries(declaration.dimensions),
    ...Object.entries(declaration.measures),
  ])
    columns[name] = ruleOf(column);
  const hidden = new Set(hiddenColumns(columns, held));
  // A formula over a hidden measure is hidden too; repeat until no formula is added (formulas are acyclic).
  for (let added = true; added;) {
    added = false;
    for (const [name, measure] of Object.entries(declaration.measures))
      if (
        !hidden.has(name) &&
        measure.formula !== undefined &&
        formulaNames(measure.formula).some((used) => hidden.has(used))
      ) {
        hidden.add(name);
        added = true;
      }
  }
  return hidden;
}
