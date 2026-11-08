/**
 * Stackra file contract:
 * Purpose: `BelongsToTenantMacro`, the partner macro of `BelongsToTenant`: `t.belongsToTenant()` writes the tenant
 *          column and the table's row-level security: `tenant_id varchar(33) not null`, indexed, with no foreign key
 *          (the tenant's node is @stackra/scope's), and ENABLE, FORCE and the generated policy `pol_<table>_tenant_id`,
 *          `tenant_id = current_setting('app.tenant_id')`. `t.belongsToTenant({ nullable: true })` is the form of
 *          `BelongsToTenantOrPlatform`: a nullable column whose NULL rows are the platform's, under the policy
 *          `tenant_id IS NOT DISTINCT FROM nullif(current_setting('app.tenant_id'), '')`, so a platform call (no tenant)
 *          sees and writes only the NULL rows and a tenant call only its own. `t.belongsToTenant({ expand: true })` is
 *          the expand step that makes an existing table tenant-owned: the nullable column, filled from `app.tenant_id`
 *          by default so every writer stores the call's tenant, and no policy: the table keeps the one it has until
 *          the contract step. `t.belongsToTenant({ contract: true })` is that step: the column NOT NULL and this
 *          equality as the table's one permissive policy (ADR 0347 decision 1); the migration drops the old policy and
 *          refuses first while a row has no tenant (`schema.refuseNulls`). `{ contract: true, nullable: true }` is the
 *          platform form's contract step (ADR 0239 amendment, gap C): the column stays nullable, a NULL row is the
 *          platform's, which every tenant reads and only a platform session writes (@stackra/database's `platform`
 *          match, with its restrictive `pol_<table>_tenant_id_write_update` and `_write_delete`).
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.belongsToTenant`. It states the
 *           column's nullability and comment itself, so the bare call compiles. Equality only, no tree logic (ADR
 *           0239): an organisation reads its children through read models. A blueprint takes one policy, so the table
 *           carries no other. A NOT NULL column without a default cannot be added to an existing table, so making an
 *           existing table tenant-owned is a backfill migration with its own expand and contract steps (rule
 *           `tenancy`, point 5); the compiler refuses the bare call there. The nullable form compiles through
 *           @stackra/database's `equalsOrUnset` policy match (STA-1300), never a hand-written policy (STA-1312).
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
 * schema.create("inbound_messages", (t: Blueprint) => t.belongsToTenant({ nullable: true }));
 */
export class BelongsToTenantMacro extends Macro {
  /**
   * Writes the column and the policy on `t`.
   *
   * @param t - the blueprint of the tenant-owned table being created.
   * @param options - `nullable: true` for a table whose NULL rows are the platform's (`BelongsToTenantOrPlatform`);
   *                  `expand: true` for the column alone on an existing table; `contract: true` for its contract step.
   * @returns the tenant column; none for the contract step, which changes the existing one.
   * @throws TypeError for `contract` with `expand`.
   */
  apply(
    t: Blueprint,
    options: {
      readonly nullable?: boolean;
      readonly expand?: boolean;
      readonly contract?: boolean;
    } = {},
  ): ColumnGroup {
    if (options.contract === true) {
      if (options.expand === true)
        throw new TypeError("t.belongsToTenant({ contract: true }) does not take expand");
      // The platform form keeps the column nullable: a NULL row is the platform's, read by every tenant.
      if (options.nullable === true)
        t.rowLevelSecurity("tenant_id", { setting: TENANT_ID_SETTING, match: "platform" });
      else {
        t.change("tenant_id").notNull();
        t.rowLevelSecurity("tenant_id", { setting: TENANT_ID_SETTING, match: "equals" });
      }
      return t.group();
    }
    const link = t.link("tenant_id");
    // A second permissive policy would OR with the table's own and widen it, so the expand step adds none.
    if (options.expand === true)
      return t.group(
        link
          .nullable()
          .defaultSetting(TENANT_ID_SETTING)
          .comment(
            "The owning tenant: its scope node's public id, filled from the call's tenant; null on an older row until backfilled.",
          ),
      );
    const column =
      options.nullable === true
        ? link
            .nullable()
            .comment(
              "The owning tenant, or NULL for a platform row; set from the call's tenant, never from input.",
            )
        : link
            .notNull()
            .comment(
              "The owning tenant: the public id of its scope node; set from the call's tenant, never from input.",
            );
    t.rowLevelSecurity("tenant_id", {
      setting: TENANT_ID_SETTING,
      match: options.nullable === true ? "equalsOrUnset" : "equals",
    });
    return t.group(column);
  }
}
