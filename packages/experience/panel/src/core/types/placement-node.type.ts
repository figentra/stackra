/**
 * Stackra file contract:
 * Purpose: `PlacementNode`, one recorded button of a resource: an action run, an export, an import or the create button,
 *          with the places it is narrowed to and the layer it was placed in.
 * Boundary: a type only; built by `Placement.*` and by the actions builder. With no `places`, gen derives them from the
 *           action's input (ADR 0307 rule 3). `layer` is the placement layer seam (ADR 0306, 0336 layer 2b).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3, 4 and 10); ADR 0306 (rules 7 and 8); ADR 0336 (decision 4).
 */
import type { AnyClass } from "@stackra/container";

import type { ActionPlace } from "#core/enums/action-place.enum";
import type { ExportFormat } from "#core/enums/export-format.enum";
import type { ImportMode } from "#core/enums/import-mode.enum";
import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { ResourcePage } from "#core/enums/resource-page.enum";

/** One placed button. */
export type PlacementNode = (
  | {
      /** A button that runs an Action. */
      readonly kind: "run";
      /** The action class. */
      readonly action: AnyClass;
      /** Whether the bulk bar carries it too, fanned out per record. */
      readonly bulk?: boolean;
    }
  | {
      /** A queued export of the current view or the selection. */
      readonly kind: "export";
      /** The file formats offered. */
      readonly formats: readonly ExportFormat[];
      /** The row paths written; the view's columns when absent. */
      readonly columns?: readonly string[];
      /** The export permission; gen fills it (`<module>.<model>.export`). */
      readonly permission?: string;
    }
  | {
      /** An import from a file, every row through the action pipeline. */
      readonly kind: "import";
      /** What each row does. */
      readonly mode: ImportMode;
      /** The unique record path a row is matched by. */
      readonly match: string;
      /** The most rows one file may hold. */
      readonly maxRows?: number;
      /** The import permission; gen fills it (`<module>.<model>.import`). */
      readonly permission?: string;
    }
  | {
      /** The create button of the list header and the empty state. */
      readonly kind: "create";
      /** Where the panel goes after a create. */
      readonly after?: ResourcePage;
    }
) & {
  /** The places it is narrowed to; derived from the action's input when absent. */
  readonly places?: readonly ActionPlace[];

  /** The layer it was placed in; the owner's when absent. */
  readonly layer?: PlacementLayer;
};
