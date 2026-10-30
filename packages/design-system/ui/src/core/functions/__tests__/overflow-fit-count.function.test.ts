/**
 * Stackra file contract:
 * Purpose: proves the toolbar fit keeps every button when they all fit without the "more" button, and otherwise keeps
 *          the most leading buttons that fit beside it, down to none.
 * Boundary: pure function; no library or DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
import { overflowFitCount } from "#core/functions/overflow-fit-count.function";

describe("overflowFitCount", () => {
  it("keeps every button when they fit, with no room kept for the more button", () => {
    expect(overflowFitCount([50, 50, 50], 166, 40, 8)).toBe(3);
    expect(overflowFitCount([], 0, 40, 8)).toBe(0);
  });

  it("keeps the leading buttons that fit beside the more button", () => {
    // 40 + (50 + 8) * 2 = 156 fits 160; a third does not.
    expect(overflowFitCount([50, 50, 50], 160, 40, 8)).toBe(2);
  });

  it("keeps none when only the more button fits", () => {
    expect(overflowFitCount([100, 50], 60, 40, 8)).toBe(0);
  });
});
