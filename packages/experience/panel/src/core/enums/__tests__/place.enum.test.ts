/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Place`: an `Enum.of` enum whose codes are in source order, a Band taking only the
 *          KPI displays, a Grid taking every built display, and a same-named type.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 18); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { DisplayKind } from "#core/enums/display-kind.enum";
import { Place } from "#core/enums/place.enum";

describe("Place", () => {
  it("holds its codes in order", () => {
    expect(Enum.values(Place)).toEqual([
      "band",
      "grid",
      "aside",
      "tabs",
      "banner",
      "checklist",
      "line_entry",
    ]);
  });

  it("lets a band take only the KPI displays", () => {
    expect(Enum.meta(Place, Place.Band).displays).toEqual(["kpi", "kpi_group", "progress"]);
    expect(Enum.meta(Place, Place.Grid).displays).toEqual(Enum.values(DisplayKind));
    expect(Enum.meta(Place, Place.Banner).displays).toEqual([]);
  });

  it("types its values", () => {
    expectTypeOf<Place>().toEqualTypeOf<
      "band" | "grid" | "aside" | "tabs" | "banner" | "checklist" | "line_entry"
    >();
  });
});
