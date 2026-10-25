/**
 * Stackra file contract:
 * Purpose: `ViewNode`, one recorded preset view of a resource table: its name, its filter values and its sort.
 * Boundary: a type only; built by `View.of` and by the views builder. The label is derived
 *           (`<module>::resources.<model>.views.<name>`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6, 9 and 12: views store declared keys only; a navigation badge names a view).
 */
import type { SortNode } from "#core/types/sort-node.type";

/** One preset view. */
export interface ViewNode {
  /** The snake_case view name. */
  readonly name: string;

  /** The filter values by row path. */
  readonly filter: Readonly<Record<string, unknown>>;

  /** The sort, when it differs from the table's default. */
  readonly sort?: SortNode;
}
