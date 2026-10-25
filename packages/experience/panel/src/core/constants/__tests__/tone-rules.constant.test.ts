/**
 * Stackra file contract:
 * Purpose: unit tests of `TONE_RULES`: each builder returns its frozen rule.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
import { Tone } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TONE_RULES } from "#core/constants/tone-rules.constant";

describe("TONE_RULES", () => {
  it("builds the four rules", () => {
    expect(TONE_RULES.belowTarget(0.8, Tone.Danger)).toEqual({ belowTarget: 0.8, tone: "danger" });
    expect(TONE_RULES.aboveTarget(1, Tone.Success)).toEqual({ aboveTarget: 1, tone: "success" });
    expect(TONE_RULES.below(5, Tone.Warning)).toEqual({ below: 5, tone: "warning" });
    expect(Object.isFrozen(TONE_RULES.above(9, Tone.Accent))).toBe(true);
  });
});
