/**
 * Stackra file contract:
 * Purpose: `Actions<R, V>`, the builder a resource's `actions(a)` member receives: buttons that run Actions, the queued
 *          export, the import and the create button, `R` being the list row and `V` the View page's record.
 * Boundary: a type only. Places follow each action's input unless narrowed; the permission is the action key's.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3, 4, 7 and 10).
 */
import type { AnyClass } from "@stackra/container";

import type { ExportFormat } from "#core/enums/export-format.enum";
import type { ImportMode } from "#core/enums/import-mode.enum";
import type { Path } from "#core/types/path.type";
import type { PlacementBuilder } from "#core/types/placement-builder.type";

/**
 * Builds the buttons of a resource over list row `R` and record `V`.
 *
 * @example
 * override actions(a: Actions<OrderView, OrderView>) {
 *   return [a.run(CancelOrderAction).bulk(), a.export({ formats: [ExportFormat.Csv] })];
 * }
 */
export interface Actions<R, V = R> {
  /** A button that runs `action`. */
  run(action: AnyClass): PlacementBuilder;

  /** The queued export of the current view or the selection, writing `columns` (the view's when absent). */
  export(options: {
    readonly formats: readonly ExportFormat[];
    readonly columns?: readonly Path<R>[];
  }): PlacementBuilder;

  /** An import whose rows are matched by the unique record path `match`. */
  import(options: {
    readonly mode: ImportMode;
    readonly match: Path<V>;
    readonly maxRows?: number;
  }): PlacementBuilder;

  /** The create button. */
  create(): PlacementBuilder;
}
