/**
 * Stackra file contract:
 * Purpose: proves `widgetSizeOfColumns` snaps a dragged span of the 12-column grid to the nearest widget size.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0307 (decision 18); ADR 0022 (test placement); STA-1371.
 */
import { widgetSizeOfColumns } from "#core/functions/widget-size-of-columns.function";

describe("widgetSizeOfColumns", () => {
  it("snaps each span to the nearest size", () => {
    expect([3, 6, 9, 12].map(widgetSizeOfColumns)).toEqual(["small", "medium", "large", "full"]);
    expect(widgetSizeOfColumns(7.2)).toBe("medium");
    expect(widgetSizeOfColumns(10.6)).toBe("full");
  });

  it("keeps spans past either end at that end", () => {
    expect(widgetSizeOfColumns(-4)).toBe("small");
    expect(widgetSizeOfColumns(0)).toBe("small");
    expect(widgetSizeOfColumns(30)).toBe("full");
  });
});
