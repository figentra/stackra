/**
 * Stackra file contract:
 * Purpose: `DataClassificationMacro`, `t.dataClassification(column)`: the column of a `DataClassification` field, text
 *          checked against the four classification codes.
 * Boundary: a `Macro` (ADR 0159 as amended by ADR 0305), installed by name as `t.dataClassification`; every host that
 *           imports this package may call it. The caller states the column's nullability and comment. The codes are
 *           literals, not read from the enum: released SQL is locked, so a new classification is a new option that
 *           defaults to today's four codes, never an edit here.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (the Macro kind, `database/macros/`); ADR 0134 (classification);
 *                     ADR 0231 (check names).
 */
import "#node/types/data-classification-blueprint.type";

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
   * Adds `column` as text with the check `ck_<table>_<column>` over the four codes.
   *
   * @param t - the blueprint of the table being defined or changed.
   * @param column - the column name, snake_case (`classification`).
   * @returns the column, for its nullability and comment.
   */
  apply(t: Blueprint, column: string): ColumnGroup {
    return t.group(t.enum(column, ["personal", "financial", "health", "pseudonymous"]));
  }
}
