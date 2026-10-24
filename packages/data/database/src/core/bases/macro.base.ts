/**
 * Stackra file contract:
 * Purpose: `Macro`, the kind base of a column convention in `database/macros/`: `apply(t, ...args)` writes the columns
 *          and returns them as a group, so `t.dataClassification("classification").notNull().comment(...)` reads like
 *          a built-in.
 * Boundary: a bare-only kind base, registered as `macro`. The blueprint method name is the class name without
 *           `Macro`, lower camel case (`DataClassificationMacro` is `t.dataClassification`); gen writes the typed
 *           `Blueprint` merge from `apply`'s parameters and passes the class to `compileMigration`. Calling a
 *           package's macro orders the migration after that package's migrations.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (column conventions are a `Macro` kind); ADR 0294 (decision 25).
 */
import { registerKind } from "@stackra/container";

import type { Blueprint } from "#core/types/blueprint.type";
import type { ColumnGroup } from "#core/types/column-group.type";

/**
 * The base of every macro.
 *
 * @example
 * export class DataClassificationMacro extends Macro {
 *   apply(t: Blueprint, column: string): ColumnGroup {
 *     return t.group(t.enum(column, ["personal", "financial", "health", "pseudonymous"]));
 *   }
 * }
 */
export abstract class Macro {
  /** Type-only kind brand, so a class of another kind cannot stand in for a macro. */
  declare readonly "~kind": "macro";

  /**
   * Writes the convention's columns on `t`.
   *
   * @param t - the blueprint of the table being defined or changed.
   * @param args - the macro's own parameters, typed by the subclass.
   * @returns the columns written, so the caller sets their nullability and comment.
   */
  abstract apply(t: Blueprint, ...args: never[]): ColumnGroup;
}

registerKind(Macro, "macro");
