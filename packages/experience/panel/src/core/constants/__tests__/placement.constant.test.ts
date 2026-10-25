/**
 * Stackra file contract:
 * Purpose: unit tests of `Placement`: run, export, import and create nodes, with frozen places and a layer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 3 and 10); ADR 0336 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { Placement } from "#core/constants/placement.constant";
import { ActionPlace } from "#core/enums/action-place.enum";
import { ExportFormat } from "#core/enums/export-format.enum";
import { ImportMode } from "#core/enums/import-mode.enum";
import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { ResourcePage } from "#core/enums/resource-page.enum";

class CancelOrderAction {}

describe("Placement", () => {
  it("builds frozen placement nodes", () => {
    const places = [ActionPlace.Row, ActionPlace.Bulk];
    const run = Placement.run(CancelOrderAction, { places, layer: PlacementLayer.Edition });
    expect(run).toEqual({
      kind: "run",
      action: CancelOrderAction,
      places: ["row", "bulk"],
      layer: "2b",
    });
    expect(run.places).not.toBe(places);
    expect(Object.isFrozen(run.places)).toBe(true);
    expect(Placement.export({ formats: [ExportFormat.Csv] })).toEqual({
      kind: "export",
      formats: ["csv"],
    });
    expect(Placement.import({ mode: ImportMode.Create, match: "slug" })).toEqual({
      kind: "import",
      mode: "create",
      match: "slug",
    });
    expect(Placement.create({ after: ResourcePage.View })).toEqual({
      kind: "create",
      after: "view",
    });
  });
});
