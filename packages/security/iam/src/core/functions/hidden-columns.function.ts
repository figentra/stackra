/**
 * Stackra file contract:
 * Purpose: `hiddenColumns(columns, held)`, the column side of access: the names of the columns a caller holding the
 *          permission keys `held` may not see. A column with a permission is hidden unless it is held; a column with a
 *          data class and no permission is hidden from everyone, since a classified column is shown only under a
 *          permission that opts it in.
 * Boundary: pure; the caller decides `held` (the decision point's `check` per key for a reader, the audience's keys for
 *           a shared definition) and drops or masks what this returns. Rows stay the visibility filter's.
 * Runtime: isomorphic
 * Governing contract: ADR 0470 (decision 6); ADR 0341 (data classes); ADR 0307 (rule 10: classified columns are
 *                     excluded unless opted in under a permission); ADR 0208 (decision 3).
 */
import type { ColumnRule } from "#core/types/column-rule.type";

/**
 * The names in `columns` hidden from a caller who holds `held`, in declaration order.
 *
 * @example
 * hiddenColumns({ margin: { permission: "orders.order.margin" }, email: { dataClass: "personal" } }, new Set());
 * // ["margin", "email"]
 */
export function hiddenColumns(
  columns: Readonly<Record<string, ColumnRule>>,
  held: ReadonlySet<string>,
): string[] {
  return Object.entries(columns)
    .filter(([, rule]) =>
      rule.permission === undefined ? rule.dataClass !== undefined : !held.has(rule.permission),
    )
    .map(([name]) => name);
}
