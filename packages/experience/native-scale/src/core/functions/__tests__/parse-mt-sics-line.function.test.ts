/**
 * Stackra file contract:
 * Purpose: proves `parseMtSicsLine` reads the transcribed MT-SICS answers: settled and moving weights with their
 *          unit and grams, the tare, overload, underload, busy and command errors, and answers null for lines that
 *          are no weight, tare or fault.
 * Boundary: test only; replays the transcribed lines of `SCALE_SDK`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0478 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { SCALE_SDK } from "#core/__tests__/scale-sdk.fixture";
import { parseMtSicsLine } from "#core/functions/parse-mt-sics-line.function";

describe("parseMtSicsLine", () => {
  it("reads settled and moving weights", () => {
    expect(parseMtSicsLine(SCALE_SDK.mtSics.stableKg)).toEqual({
      kind: "weight",
      value: 1.25,
      unit: "kg",
      grams: 1250,
      isStable: true,
      isNet: null,
    });
    expect(parseMtSicsLine(SCALE_SDK.mtSics.movingKg)).toMatchObject({
      grams: 1180,
      isStable: false,
    });
    expect(parseMtSicsLine(SCALE_SDK.mtSics.stableLb)).toMatchObject({
      unit: "lb",
      grams: 907.1847,
    });
    expect(parseMtSicsLine("S S     -0.50 g")).toMatchObject({ grams: -0.5 });
  });

  it("reads the tare", () => {
    expect(parseMtSicsLine(SCALE_SDK.mtSics.tareKg)).toEqual({ kind: "tare", grams: 150 });
    expect(parseMtSicsLine("T S      0.150 kg")).toEqual({ kind: "tare", grams: 150 });
  });

  it("reads faults", () => {
    expect(parseMtSicsLine(SCALE_SDK.mtSics.overload)).toEqual({
      kind: "fault",
      fault: "overload",
    });
    expect(parseMtSicsLine(SCALE_SDK.mtSics.underload)).toEqual({
      kind: "fault",
      fault: "underload",
    });
    expect(parseMtSicsLine(SCALE_SDK.mtSics.busy)).toEqual({ kind: "fault", fault: "busy" });
    expect(parseMtSicsLine(SCALE_SDK.mtSics.syntaxError)).toEqual({
      kind: "fault",
      fault: "error",
    });
    expect(parseMtSicsLine("TA L")).toEqual({ kind: "fault", fault: "error" });
  });

  it("answers null for other lines", () => {
    expect(parseMtSicsLine(SCALE_SDK.mtSics.reset)).toBeNull();
    expect(parseMtSicsLine("")).toBeNull();
    expect(parseMtSicsLine("S S     12 PCS")).toBeNull();
  });
});
