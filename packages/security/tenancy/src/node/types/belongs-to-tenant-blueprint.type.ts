/**
 * Stackra file contract:
 * Purpose: the `Blueprint` member of `BelongsToTenantMacro`, so a migration's `t.belongsToTenant()` typechecks.
 * Boundary: a module augmentation only; the stand-in for the merge gen writes from each `*.macro.ts` a member hosts
 *           (`declare module "@stackra/database" { interface Blueprint { ... } }`, ADR 0159 as amended by ADR 0305).
 *           `BelongsToTenantMacro` imports this file so the augmentation travels with the macro.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros merge into `Blueprint`); ADR 0239.
 */
import type { ColumnGroup } from "@stackra/database";

declare module "@stackra/database" {
  interface Blueprint {
    /**
     * The `BelongsToTenant` trait's column on a table being created: `tenant_id varchar(33) not null`, indexed, and
     * forced row-level security with the equality policy `pol_<table>_tenant_id` on `app.tenant_id`. With
     * `nullable: true`, the nullable column of `BelongsToTenantOrPlatform`: NULL rows are the platform's. With
     * `expand: true`, the expand step of an existing table: the nullable column only, filled from `app.tenant_id` by
     * default, and no policy until the contract step. With `contract: true`, that step: the column NOT NULL and the
     * equality policy (the migration drops the table's old policy, after `schema.refuseNulls`). With `contract: true`
     * and `nullable: true`, the platform form's contract: the column stays nullable, and its policy shows a tenant its
     * rows and the platform's NULL rows, and lets it write only its own. With `contract: true` and `safeNotNull: true`,
     * NOT NULL through a validated check, with no scan under an exclusive lock: every new contract step uses it.
     */
    belongsToTenant: (options?: {
      readonly nullable?: boolean;
      readonly expand?: boolean;
      readonly contract?: boolean;
      readonly safeNotNull?: boolean;
    }) => ColumnGroup;
  }
}
