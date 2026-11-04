/**
 * Stackra file contract:
 * Purpose: part of the consumer contract of the `./react` entry: the components of the UI build list's wave 2 fields
 *          and maps (`Autocomplete`, `ColorField`, `ColorSwatch`, `Flag`, `MarkerMap`) are exported, each the same
 *          function as its own module.
 * Boundary: test only; imports the barrel through its `#react` alias. The entry's other exports are proved by their
 *           own tests.
 * Runtime: browser (vitest, jsdom: some modules the barrel loads read the window)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); STA-1981.
 */
// @vitest-environment jsdom
import { Autocomplete } from "#react/autocomplete/autocomplete";
import { ColorField } from "#react/color-field/color-field";
import { ColorSwatch } from "#react/color-swatch/color-swatch";
import { Flag } from "#react/flag/flag";
import * as react from "#react/index";
import { MarkerMap } from "#react/marker-map/marker-map";

describe("@stackra/ui/react", () => {
  it("exports the wave 2 fields and maps", () => {
    expect(react.Autocomplete).toBe(Autocomplete);
    expect(react.ColorField).toBe(ColorField);
    expect(react.ColorSwatch).toBe(ColorSwatch);
    expect(react.Flag).toBe(Flag);
    expect(react.MarkerMap).toBe(MarkerMap);
  });
});
