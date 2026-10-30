/**
 * Stackra file contract:
 * Purpose: proves `fitTabs` keeps every tab when they fit, else keeps the selected tab and the leading tabs that fit
 *          beside the "More" button, in their order, and never empties the row.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { fitTabs } from "#core/functions/fit-tabs.function";

const IDS = ["a", "b", "c", "d"];
const WIDTHS = new Map(IDS.map((id) => [id, 100]));

describe("fitTabs", () => {
  it("keeps every tab when they fit", () => {
    expect(fitTabs(IDS, WIDTHS, "a", 410, { chrome: 8, more: 60 })).toEqual(IDS);
  });

  it("keeps the selected tab and the leading ones that fit beside More", () => {
    // 300 - 8 - 60 - 8 = 224: the selected d, then a; b would pass it.
    expect(fitTabs(IDS, WIDTHS, "d", 300, { chrome: 8, more: 60 })).toEqual(["a", "d"]);
  });

  it("keeps the selected tab even when it alone is too wide", () => {
    expect(fitTabs(IDS, WIDTHS, "c", 50, { chrome: 0, more: 60 })).toEqual(["c"]);
  });
});
