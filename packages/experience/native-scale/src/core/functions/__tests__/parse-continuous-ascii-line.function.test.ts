/**
 * Stackra file contract:
 * Purpose: proves `parseContinuousAsciiLine` reads the transcribed A&D standard format lines: settled and moving
 *          weights, net and gross, negative values, the tare and overload, and answers null for counting mode and
 *          lines of another shape.
 * Boundary: test only; replays the transcribed lines of `SCALE_SDK`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { parseContinuousAsciiLine } from "#core/functions/parse-continuous-ascii-line.function";

describe("parseContinuousAsciiLine", () => {
  it("reads settled, moving, net and gross weights", () => {
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.stableNetKg)).toEqual({
      kind: "weight",
      value: 1.25,
      unit: "kg",
      grams: 1250,
      isStable: true,
      isNet: true,
    });
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.stableGrossGrams)).toMatchObject({
      grams: 250,
      isNet: false,
    });
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.stableGrams)).toMatchObject({
      grams: 250,
      isStable: true,
      isNet: null,
    });
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.moving)).toMatchObject({
      grams: 248.1,
      isStable: false,
    });
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.negative)).toMatchObject({ grams: -1.2 });
  });

  it("reads the tare and overload", () => {
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.tare)).toEqual({
      kind: "tare",
      grams: 150,
    });
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.overload)).toEqual({
      kind: "fault",
      fault: "overload",
    });
  });

  it("answers null for counting mode and other lines", () => {
    expect(parseContinuousAsciiLine(SCALE_SDK.continuous.counting)).toBeNull();
    expect(parseContinuousAsciiLine(SCALE_SDK.mtSics.stableKg)).toBeNull();
    expect(parseContinuousAsciiLine("")).toBeNull();
  });
});
