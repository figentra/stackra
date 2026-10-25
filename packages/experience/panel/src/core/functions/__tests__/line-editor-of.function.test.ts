/**
 * Stackra file contract:
 * Purpose: unit tests of `lineEditorOf`: the base's editor alone, an edition's editor replacing it at layer 2b, an
 *          app's replacing both, no editor for an empty slot, and two editors at one layer refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0350 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { PlacementLayer } from "#core/enums/placement-layer.enum";
import { lineEditorOf } from "#core/functions/line-editor-of.function";

const SLOT = "sales.order.lines";
const base = { key: "sales.line_table", slot: SLOT, layer: PlacementLayer.Owner };
const edition = { key: "retail.size_grid", slot: SLOT, layer: PlacementLayer.Edition };
const elsewhere = { key: "other.editor", slot: "purchasing.po.lines", layer: PlacementLayer.App };

describe("lineEditorOf", () => {
  it("gives the base's editor alone and the highest layer's otherwise", () => {
    expect(lineEditorOf(SLOT, [base, elsewhere])).toBe(base);
    expect(lineEditorOf(SLOT, [base, edition])).toBe(edition);
    const app = { key: "app.lines", slot: SLOT, layer: PlacementLayer.App };
    expect(lineEditorOf(SLOT, [edition, app, base])).toBe(app);
  });

  it("gives none for an empty slot and refuses two at one layer", () => {
    expect(lineEditorOf(SLOT, [elsewhere])).toBeUndefined();
    expect(() => lineEditorOf(SLOT, [edition, { ...edition, key: "retail.other" }])).toThrow(
      RangeError,
    );
  });
});
