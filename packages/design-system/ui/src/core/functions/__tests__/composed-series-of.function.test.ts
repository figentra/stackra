/**
 * Stackra file contract:
 * Purpose: unit test of `composedSeriesOf`: an uncoloured line takes `chart-4`; columns and coloured lines keep theirs.
 * Boundary: pure; no DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { composedSeriesOf } from "#core/functions/composed-series-of.function";

describe("composedSeriesOf", () => {
  it("colours only the uncoloured lines", () => {
    const series = [
      { key: "revenue", label: "Revenue" },
      { key: "target", label: "Target" },
      { key: "margin", label: "Margin", color: "success" as const },
    ];
    expect(
      composedSeriesOf(series, new Set(["target", "margin"])).map((item) => item.color),
    ).toEqual([undefined, "chart-4", "success"]);
  });
});
