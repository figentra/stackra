/**
 * Stackra file contract:
 * Purpose: `Placement`, the data constructors of a resource's placed buttons, as a generated resource writes them
 *          (`Placement.run(CancelOrderAction, { places: [ActionPlace.Row, ActionPlace.Bulk] })`).
 * Boundary: pure: each returns a frozen `PlacementNode`; the actions builder records through them. `layer` carries the
 *           placement layer (ADR 0306, 0336 layer 2b).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 3, 4 and 10); ADR 0306 (rules 7 and 8); ADR 0336 (decision 4).
 */
import type { AnyClass } from "@stackra/container";

import type { ActionPlace } from "#core/enums/action-place.enum";
import type { ExportFormat } from "#core/enums/export-format.enum";
import type { ImportMode } from "#core/enums/import-mode.enum";
import type { PlacementLayer } from "#core/enums/placement-layer.enum";
import type { ResourcePage } from "#core/enums/resource-page.enum";
import type { PlacementNode } from "#core/types/placement-node.type";

/** What every placement may carry. */
interface PlacementOptions {
  readonly places?: readonly ActionPlace[];
  readonly layer?: PlacementLayer;
}

/** The options with their places frozen. */
function frozen<O extends PlacementOptions>(options: O): O {
  return options.places === undefined
    ? options
    : { ...options, places: Object.freeze([...options.places]) };
}

/**
 * Builds the placement nodes that put actions on resource pages.
 *
 * @example
 * Placement.import({ mode: ImportMode.Upsert, match: "slug", places: [ActionPlace.ListHeader, ActionPlace.Empty] });
 * Placement.create({ after: ResourcePage.View });
 */
export const Placement = Object.freeze({
  /** A button that runs `action`. */
  run: (
    action: AnyClass,
    options: PlacementOptions & { readonly bulk?: boolean } = {},
  ): PlacementNode => Object.freeze({ kind: "run", action, ...frozen(options) }),

  /** The queued export. */
  export: (
    options: PlacementOptions & {
      readonly formats: readonly ExportFormat[];
      readonly columns?: readonly string[];
      readonly permission?: string;
    },
  ): PlacementNode => Object.freeze({ kind: "export", ...frozen(options) }),

  /** An import matched by the unique record path `match`. */
  import: (
    options: PlacementOptions & {
      readonly mode: ImportMode;
      readonly match: string;
      readonly maxRows?: number;
      readonly permission?: string;
    },
  ): PlacementNode => Object.freeze({ kind: "import", ...frozen(options) }),

  /** The create button. */
  create: (options: PlacementOptions & { readonly after?: ResourcePage } = {}): PlacementNode =>
    Object.freeze({ kind: "create", ...frozen(options) }),
});
