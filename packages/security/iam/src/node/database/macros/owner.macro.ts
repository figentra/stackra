/**
 * Stackra file contract:
 * Purpose: `OwnerMacro`, the partner macro of `HasOwner`: `t.owner()` writes `owner_id varchar(33)`, nullable and
 *          indexed, so "my records" reads by the index.
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.owner`. No foreign key: the owner is
 *           a principal of the identity service, not a row of this schema. The column is nullable, so it adds to an
 *           existing table without a backfill.
 * Runtime: node
 * Governing contract: ADR 0321 (decisions 2 and 4: `HasOwner`); ADR 0159 as amended by ADR 0305 (macros); data-layer
 *                     gap mo18.
 */
import "#node/types/owner-blueprint.type";

import { Macro } from "@stackra/database";
import type { Blueprint, ColumnGroup } from "@stackra/database";

/**
 * The owner column.
 *
 * @example
 * schema.create("tickets", (t: Blueprint) => {
 *   t.hasPublicId("tkt");
 *   t.owner();
 * });
 */
export class OwnerMacro extends Macro {
  /**
   * Writes the owner column on `t`.
   *
   * @param t - the blueprint of the table being created or changed.
   * @returns the owner column.
   */
  apply(t: Blueprint): ColumnGroup {
    return t.group(
      t
        .link("owner_id")
        .nullable()
        .comment("The principal who owns or is assigned the record; null while unassigned."),
    );
  }
}
