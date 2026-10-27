/**
 * Stackra file contract:
 * Purpose: unit tests of `duration(text)`: each short unit and ISO 8601 read into the canonical `Duration`, equal to
 *          the `Duration.*` constructor of the same length, and anything else throws a `RangeError`.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { duration } from "#core/functions/duration.function";

describe("duration()", () => {
  it.each([
    ["500ms", Duration.seconds(0.5)],
    ["60s", Duration.seconds(60)],
    ["5m", Duration.minutes(5)],
    ["1m", Duration.minutes(1)],
    ["1.5h", Duration.minutes(90)],
    ["2d", Duration.days(2)],
    ["PT600S", Duration.minutes(10)],
    ["P1W", Duration.days(7)],
  ])("reads %s", (text, expected) => {
    expect(duration(text)).toBe(expected);
  });

  it("gives the canonical form gen evaluates in defaults", () => {
    expect(duration("60s")).toBe("PT1M");
  });

  it("is Duration.parse, the one parser since stackra-223", () => {
    for (const text of ["200ms", "6h", "PT30S"]) expect(duration(text)).toBe(Duration.parse(text));
  });

  it.each(["", "60", "5 m", "1y", "-5s", "P1M", "soon"])("refuses %j", (text) => {
    expect(() => duration(text)).toThrow(RangeError);
  });
});
