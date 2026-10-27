/**
 * Stackra file contract:
 * Purpose: `placementsAt(placements, place, takesRecord)`, the placed buttons a resource page shows at one place: the
 *          declared places when `.in(...)` narrowed them, else the defaults of ADR 0307 rule 3.
 * Boundary: internal; pure. `takesRecord` tells whether an action's input has the record id (the caller reads the
 *           action's schema). Export and import sit in the List header; create in the List header and the empty state.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3: default places follow the input).
 */
import type { AnyClass } from "@stackra/container";

import { ActionPlace } from "#core/enums/action-place.enum";
import type { PlacementNode } from "#core/types/placement-node.type";

/** The default places of `node`. */
function defaults(node: PlacementNode, takesRecord: (action: AnyClass) => boolean): ActionPlace[] {
  if (node.kind === "create") return [ActionPlace.ListHeader, ActionPlace.Empty];
  if (node.kind !== "run") return [ActionPlace.ListHeader];
  if (!takesRecord(node.action)) return [ActionPlace.ListHeader];
  const record = [ActionPlace.Row, ActionPlace.View, ActionPlace.Edit];
  return node.bulk === true ? [...record, ActionPlace.Bulk] : record;
}

/**
 * The placements of `placements` shown at `place`.
 *
 * @example
 * placementsAt(tree.actions ?? [], ActionPlace.Row, (action) => recordIdKey(action.input, key) !== undefined);
 */
export function placementsAt(
  placements: readonly PlacementNode[],
  place: ActionPlace,
  takesRecord: (action: AnyClass) => boolean,
): PlacementNode[] {
  return placements.filter((node) => {
    const places = node.places ?? defaults(node, takesRecord);
    // `.bulk()` adds the bulk bar even to narrowed places.
    return (
      places.includes(place) ||
      (place === ActionPlace.Bulk && node.kind === "run" && node.bulk === true)
    );
  });
}
