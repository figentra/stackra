/**
 * Stackra file contract:
 * Purpose: unit tests of `toneOf`: the first matching rule wins, target rules need a target, and no value means no tone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
import { Tone } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { toneOf } from "#core/functions/tone-of.function";

const RULES = [
  { belowTarget: 0.8, tone: Tone.Danger },
  { belowTarget: 1, tone: Tone.Warning },
  { aboveTarget: 1, tone: Tone.Success },
];

describe("toneOf", () => {
  it("picks the first matching rule", () => {
    expect(toneOf({ value: 70, target: 100 }, RULES)).toBe("danger");
    expect(toneOf({ value: 90, target: 100 }, RULES)).toBe("warning");
    expect(toneOf({ value: 100, target: 100 }, RULES)).toBe("success");
  });

  it("needs a target for target rules and a value for any rule", () => {
    expect(toneOf({ value: 70, target: null }, RULES)).toBeUndefined();
    expect(toneOf({ value: null, target: 100 }, RULES)).toBeUndefined();
    expect(toneOf({ value: 3, target: null }, [{ below: 5, tone: Tone.Warning }])).toBe("warning");
    expect(toneOf({ value: 5, target: null }, [{ above: 5, tone: Tone.Accent }])).toBe("accent");
  });
});
