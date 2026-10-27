/**
 * Stackra file contract:
 * Purpose: unit tests of `placementsAt`: the default places of ADR 0307 rule 3 (a record action on the row, View and
 *          Edit; `.bulk()` adds the bulk bar; an action without a record in the list header; create in the list header
 *          and the empty state), and `.in(...)` narrowing them.
 * Boundary: test only; `takesRecord` is a stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActionPlace } from "#core/enums/action-place.enum";
import { ExportFormat } from "#core/enums/export-format.enum";
import { placementsAt } from "#core/functions/placements-at.function";
import type { PlacementNode } from "#core/types/placement-node.type";

class FreezeAction {}
class RecalculateAction {}

const freeze: PlacementNode = { kind: "run", action: FreezeAction, bulk: true };
const recalc: PlacementNode = { kind: "run", action: RecalculateAction };
const create: PlacementNode = { kind: "create" };
const exported: PlacementNode = { kind: "export", formats: [ExportFormat.Csv] };
const narrowed: PlacementNode = { kind: "run", action: FreezeAction, places: [ActionPlace.View] };
const all = [freeze, recalc, create, exported, narrowed];
const takesRecord = (action: unknown) => action === FreezeAction;

describe("placementsAt", () => {
  it("places record actions on the row, View and Edit, and bulk ones in the bulk bar", () => {
    expect(placementsAt(all, ActionPlace.Row, takesRecord)).toEqual([freeze]);
    expect(placementsAt(all, ActionPlace.View, takesRecord)).toEqual([freeze, narrowed]);
    expect(placementsAt(all, ActionPlace.Bulk, takesRecord)).toEqual([freeze]);
  });

  it("places the rest in the list header and create in the empty state too", () => {
    expect(placementsAt(all, ActionPlace.ListHeader, takesRecord)).toEqual([
      recalc,
      create,
      exported,
    ]);
    expect(placementsAt(all, ActionPlace.Empty, takesRecord)).toEqual([create]);
  });
});
