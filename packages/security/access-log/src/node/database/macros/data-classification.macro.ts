/**
 * Stackra file contract:
 * Purpose: `DataClassificationMacro`, `t.dataClassification(column)`: the column of a `DataClassification` field, text
 *          checked against every classification code.
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.dataClassification`; every host that
 *           imports this package may call it. The caller states the column's nullability and comment. The codes are
 *           read from the `DataClassification` enum, so a new class (`regulated`, STA-1237) reaches every new
 *           migration; an existing table gains it through a migration that replaces its check (STA-1300).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (the Macro kind, `database/macros/`); ADR 0134 (classification);
 *                     ADR 0231 (check names).
 */
import "#node/types/data-classification-blueprint.type";

import { DataClassification, Enum } from "@stackra/contracts";
import { Macro } from "@stackra/database";
import type { Blueprint, ColumnGroup } from "@stackra/database";

/**
 * One classification column, the same set wherever a classification is stored.
 *
 * @example
 * schema.create("data_exports", (t: Blueprint) => {
 *   t.dataClassification("classification").notNull().comment("The classification of the exported data.");
 * });
 */
export class DataClassificationMacro extends Macro {
  /**
   * Adds `column` as text with the check `ck_<table>_<column>` over the `DataClassification` codes.
   *
   * @param t - the blueprint of the table being defined or changed.
   * @param column - the column name, snake_case (`classification`).
   * @returns the column, for its nullability and comment.
   */
  apply(t: Blueprint, column: string): ColumnGroup {
    return t.group(t.enum(column, Enum.values(DataClassification)));
  }
}
