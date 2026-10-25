/**
 * Stackra file contract:
 * Purpose: the `Blueprint` member of `DataClassificationMacro`, so a migration's `t.dataClassification(column)`
 *          typechecks.
 * Boundary: a module augmentation only; the stand-in for the merge gen writes from each `*.macro.ts` a member hosts
 *           (ADR 0159 as amended by ADR 0305). `DataClassificationMacro` imports this file so the augmentation travels
 *           with the macro.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros merge into `Blueprint`); ADR 0134.
 */
import type { ColumnGroup } from "@stackra/database";

declare module "@stackra/database" {
  interface Blueprint {
    /** A `DataClassification` column: `text` limited to the four classification codes by `ck_<table>_<column>`. */
    dataClassification(column: string): ColumnGroup;
  }
}
