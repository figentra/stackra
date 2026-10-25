/**
 * Stackra file contract:
 * Purpose: `BelongsToTenantMacro`, the partner macro of `BelongsToTenant`: `t.belongsToTenant()` writes the tenant
 *          column and the table's row-level security: `tenant_id varchar(33) not null`, indexed, with no foreign key
 *          (the tenant's node is @stackra/scope's), and ENABLE, FORCE and the generated policy `pol_<table>_tenant_id`,
 *          `tenant_id = current_setting('app.tenant_id')`.
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.belongsToTenant`. It states the
 *           column's nullability and comment itself, so the bare call compiles. Equality only, no tree logic (ADR
 *           0239): an organisation reads its children through read models. A blueprint takes one policy, so the table
 *           carries no other. A NOT NULL column without a default cannot be added to an existing table, so making an
 *           existing table tenant-owned is a backfill migration with its own expand and contract steps (rule
 *           `tenancy`, point 5); the compiler refuses the bare call there.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0327 (decision 8); ADR 0159 as amended by ADR 0305 (macros); ADR
 *                     0231 (policy name `pol_<table>_<column>`); `.agents/rules/tenancy.md` (point 2).
 */
import "#node/types/belongs-to-tenant-blueprint.type";

import { Macro } from "@stackra/database";
import type { Blueprint, ColumnGroup } from "@stackra/database";

import { TENANT_ID_SETTING } from "#node/constants/tenant-id-setting.constant";

/**
 * The tenant column and policy.
 *
 * @example
 * schema.create("orders", (t: Blueprint) => {
 *   t.hasPublicId("ord");
 *   t.belongsToTenant();
 *   t.timestamps();
 * });
 */
export class BelongsToTenantMacro extends Macro {
  /**
   * Writes the column and the policy on `t`.
   *
   * @param t - the blueprint of the tenant-owned table being created.
   * @returns the tenant column.
   */
  apply(t: Blueprint): ColumnGroup {
    const column = t
      .link("tenant_id")
      .notNull()
      .comment(
        "The owning tenant: the public id of its scope node; set from the call's tenant, never from input.",
      );
    t.rowLevelSecurity("tenant_id", { setting: TENANT_ID_SETTING, match: "equals" });
    return t.group(column);
  }
}
