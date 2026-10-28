/**
 * Stackra file contract:
 * Purpose: `ExportSource`, what a module's export action hands `ExportRunner`: the resource's list query, the row shape
 *          whose `@Classified` fields are dropped, and the columns that may opt back in under an L2 permission.
 * Boundary: a type only. The list query is run as the reader, so its permission and the visibility filter decide every
 *           row; the row shape is the list query's item class.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 4 and 10); ADR 0163 (decision 4); ADR 0134 (classification).
 */
import type { Query } from "@stackra/actions";
import type { AnyClass } from "@stackra/container";
import type { Permission } from "@stackra/iam";

/** The source of one resource's export. */
export interface ExportSource {
  /** The resource's list query (`ListOrdersQuery`). */
  readonly list: AnyClass<Query>;

  /** The list query's item class, read for `@Classified` fields. */
  readonly row: AnyClass;

  /** The classified columns that stay when the reader holds `permission` (an L2 verb, `orders.order.export_personal`). */
  readonly classified?: {
    readonly columns: readonly string[];
    readonly permission: Permission | string;
  };
}
