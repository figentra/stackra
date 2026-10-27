/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Duration`: canonical ISO 8601 output, equal lengths are `===`, `parse` normalises
 *          ISO 8601 and the short form (`"200ms"`, `"6h"`)
 *          and refuses calendar units and malformed text, `toMilliseconds` round-trips, the constructors are pure and
 *          refuse negative and non-finite amounts, and a raw string is not a Duration.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { Duration } from "#core/constants/duration.constant";

describe("Duration", () => {
  it.each([
    [Duration.seconds(0), "PT0S"],
    [Duration.seconds(3), "PT3S"],
    [Duration.seconds(90), "PT1M30S"],
    [Duration.seconds(1.5), "PT1.5S"],
    [Duration.seconds(0.0004), "PT0S"],
    [Duration.minutes(10), "PT10M"],
    [Duration.hours(1), "PT1H"],
    [Duration.hours(25), "P1DT1H"],
    [Duration.days(1), "P1D"],
    [Duration.days(30), "P30D"],
    [Duration.days(1.5), "P1DT12H"],
  ] as const)("%s is written %s", (duration, expected) => {
    expect(duration).toBe(expected);
  });

  it("writes one length one way, so equal lengths compare with ===", () => {
    expect(Duration.seconds(60)).toBe(Duration.minutes(1));
    expect(Duration.minutes(1440)).toBe(Duration.days(1));
    expect(Duration.parse("PT600S")).toBe(Duration.minutes(10));
  });

  it.each([
    ["PT10M", "PT10M"],
    ["PT600S", "PT10M"],
    ["P1W", "P7D"],
    ["P1DT0.5S", "P1DT0.5S"],
    ["PT36H", "P1DT12H"],
    ["PT0S", "PT0S"],
    ["200ms", "PT0.2S"],
    ["1.5s", "PT1.5S"],
    ["30s", "PT30S"],
    ["5m", "PT5M"],
    ["6h", "PT6H"],
    ["1d", "P1D"],
    ["0ms", "PT0S"],
  ])("parses %s as %s", (text, expected) => {
    expect(Duration.parse(text)).toBe(expected);
  });

  it.each([
    "",
    "P",
    "PT",
    "P1DT",
    "1D",
    "P1Y",
    "P1M",
    "PT-1S",
    "PT1,5S",
    "pt1s",
    "P1H",
    "-1s",
    "1w",
    "s",
    "1S",
    "1 s",
  ])("refuses %j", (text) => {
    expect(() => Duration.parse(text)).toThrow(RangeError);
  });

  it("reads back the length in milliseconds", () => {
    expect(Duration.toMilliseconds(Duration.minutes(10))).toBe(600_000);
    expect(Duration.toMilliseconds(Duration.seconds(1.5))).toBe(1_500);
    expect(Duration.toMilliseconds(Duration.days(1))).toBe(86_400_000);
    expect(Duration.toMilliseconds(Duration.parse("P1W"))).toBe(604_800_000);
  });

  it("round-trips through ISO 8601 text", () => {
    for (const duration of [
      Duration.seconds(5),
      Duration.hours(4),
      Duration.days(7),
      Duration.seconds(3661.25),
    ])
      expect(Duration.parse(String(duration))).toBe(duration);
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("refuses the amount %s", (amount) => {
    expect(() => Duration.seconds(amount)).toThrow(RangeError);
    expect(() => Duration.days(amount)).toThrow(RangeError);
  });

  it("is a pure, frozen set of constructors, so gen can evaluate a default", () => {
    expect(Object.isFrozen(Duration)).toBe(true);
    expect(Duration.hours(1)).toBe(Duration.hours(1));
  });

  it("accepts only values the constructors made", () => {
    const made: Duration = Duration.seconds(60);
    // @ts-expect-error -- a raw string is not a Duration
    const raw: Duration = "PT1M";
    expect(made).toBe(raw);
  });
});
