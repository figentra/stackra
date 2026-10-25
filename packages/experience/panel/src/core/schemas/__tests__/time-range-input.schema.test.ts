/**
 * Stackra file contract:
 * Purpose: unit tests of `TimeRangeInput`: today and compare by default, a custom range needs a start and an end after it,
 *          and a subclass is its own shape.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 20).
 */
import { schemaOf } from "@stackra/validation";
import { describe, expect, it } from "@stackra/testing";

import { TIME_RANGE_INPUT_SCHEMA } from "#core/constants/time-range-input-schema.constant";
import { TimeRange } from "#core/enums/time-range.enum";
import { TimeRangeInput } from "#core/schemas/time-range-input.schema";

describe("TimeRangeInput", () => {
  it("defaults to today with the comparison", () => {
    expect(TIME_RANGE_INPUT_SCHEMA.parse({})).toEqual({ range: "today", compare: true });
    expect(schemaOf(TimeRangeInput)).toBe(TIME_RANGE_INPUT_SCHEMA);
    expect(TimeRangeInput.create({ range: TimeRange.Last7Days, compare: false })).toMatchObject({
      range: "last_7_days",
      compare: false,
    });
  });

  it("reads the wire dates and checks a custom range", () => {
    const parsed = TIME_RANGE_INPUT_SCHEMA.parse({
      range: "custom",
      from: "2026-10-01T00:00:00Z",
      to: "2026-10-08T00:00:00Z",
    });
    expect(parsed.from).toEqual(new Date("2026-10-01T00:00:00Z"));
    expect(TIME_RANGE_INPUT_SCHEMA.safeParse({ range: "custom" }).success).toBe(false);
    expect(
      TIME_RANGE_INPUT_SCHEMA.safeParse({
        from: "2026-10-08T00:00:00Z",
        to: "2026-10-01T00:00:00Z",
      }).success,
    ).toBe(false);
  });
});
