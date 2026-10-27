/**
 * Stackra file contract:
 * Purpose: unit tests of `handoverSteps`: announcement, dial and the default hang-up; a fallback replaces the hang-up;
 *          a bad ring time or an announcement without a voice refuses.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; PUT-216.
 */
import { describe, expect, it } from "@stackra/testing";

import { handoverSteps } from "#core/voice/handover-steps.function";

const speech = { language: "ar-SA" };

describe("handoverSteps", () => {
  it("announces, dials and hangs up when nobody answers", () => {
    expect(
      handoverSteps({
        to: "+966500000000",
        callerId: "+966110000000",
        timeoutSeconds: 20,
        announce: "A",
        speech,
      }),
    ).toEqual([
      { kind: "say", text: "A", speech },
      { kind: "handover", to: "+966500000000", callerId: "+966110000000", timeoutSeconds: 20 },
      { kind: "hang_up" },
    ]);
  });

  it("runs the fallback instead of hanging up", () => {
    const fallback = [{ kind: "say", text: "F", speech }] as const;
    expect(handoverSteps({ to: "+966500000000", timeoutSeconds: 15, fallback })).toEqual([
      { kind: "handover", to: "+966500000000", timeoutSeconds: 15 },
      ...fallback,
    ]);
  });

  it("refuses a bad ring time or an unvoiced announcement", () => {
    expect(() => handoverSteps({ to: "+966500000000", timeoutSeconds: 0 })).toThrow(RangeError);
    expect(() => handoverSteps({ to: "+966500000000", timeoutSeconds: 10, announce: "A" })).toThrow(
      TypeError,
    );
  });
});
