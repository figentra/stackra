/**
 * Stackra file contract:
 * Purpose: proves `progressStateOf` is empty without a value, clamps a value to its range, turns it into a percentage
 *          of that range, writes the default text as a percentage in the locale (Arabic digits included), prefers the
 *          caller's text, and treats an empty range as nothing done.
 * Boundary: pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0022 (test placement).
 */
// @covers sta-350:FR-117
import {
  progressStateOf,
  type ProgressStateInput,
} from "#core/functions/progress-state-of.function";

const input = (overrides: Partial<ProgressStateInput> = {}): ProgressStateInput => ({
  value: 40,
  minValue: 0,
  maxValue: 100,
  valueLabel: undefined,
  locale: "en",
  ...overrides,
});

describe("progressStateOf", () => {
  it("is empty while the value is unknown", () => {
    expect(progressStateOf(input({ value: undefined }))).toEqual({
      percentage: undefined,
      valueText: undefined,
      accessibilityValue: undefined,
    });
  });

  it("gives the percentage, its text and the accessibility value", () => {
    expect(progressStateOf(input())).toEqual({
      percentage: 40,
      valueText: "40%",
      accessibilityValue: { min: 0, max: 100, now: 40, text: "40%" },
    });
  });

  it.each([
    [-5, 0],
    [0, 0],
    [100, 100],
    [250, 100],
  ])("holds %s to the range, so it fills %s per cent", (value, percentage) => {
    expect(progressStateOf(input({ value })).percentage).toBe(percentage);
  });

  it("measures a custom range from its own minimum", () => {
    const state = progressStateOf(input({ value: 5, minValue: 2, maxValue: 12 }));
    expect(state.percentage).toBe(30);
    expect(state.accessibilityValue).toMatchObject({ min: 2, max: 12, now: 5 });
  });

  it("writes the percentage in the locale", () => {
    expect(progressStateOf(input({ locale: "ar-EG" })).valueText).toBe(
      new Intl.NumberFormat("ar-EG", { style: "percent" }).format(0.4),
    );
  });

  it("prefers the caller's text, for the shown and the spoken value alike", () => {
    const state = progressStateOf(input({ value: 3, maxValue: 12, valueLabel: "3 of 12 files" }));
    expect(state.valueText).toBe("3 of 12 files");
    expect(state.accessibilityValue?.text).toBe("3 of 12 files");
  });

  it("treats an empty range as nothing done", () => {
    expect(progressStateOf(input({ value: 7, minValue: 7, maxValue: 7 })).percentage).toBe(0);
  });
});
