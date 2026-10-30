/**
 * Stackra file contract:
 * Purpose: proves `chartAnnotationTextOf` writes an annotation as its label and its category, the category as given
 *          or as a date in the locale.
 * Boundary: pure function; no rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371.
 */
import { chartAnnotationTextOf } from "#core/functions/chart-annotation-text-of.function";

describe("chartAnnotationTextOf", () => {
  it("writes the label and the category as given", () => {
    expect(chartAnnotationTextOf({ at: "Mar", label: "Launch" }, "en")).toBe("Launch: Mar");
  });

  it("writes a date category in the locale", () => {
    expect(
      chartAnnotationTextOf({ at: "2026-03-01", label: "Launch" }, "en", {
        month: "short",
        year: "numeric",
      }),
    ).toBe("Launch: Mar 2026");
  });
});
