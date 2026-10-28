/**
 * Stackra file contract:
 * Purpose: the `Blueprint` member of `OwnerMacro`, so a migration's `t.owner()` typechecks.
 * Boundary: a module augmentation only; the stand-in for the merge gen writes from each `*.macro.ts` a member hosts
 *           (`declare module "@stackra/database" { interface Blueprint { ... } }`, ADR 0159 as amended by ADR 0305).
 *           `OwnerMacro` imports this file so the augmentation travels with the macro.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros merge into `Blueprint`); ADR 0321 (`HasOwner`).
 */
import type { ColumnGroup } from "@stackra/database";

declare module "@stackra/database" {
  interface Blueprint {
    /**
     * The `HasOwner` trait's column: `owner_id varchar(33)`, nullable (unassigned), indexed for "my records", with no
     * foreign key (principals live in the identity service).
     */
    owner: () => ColumnGroup;
  }
}
