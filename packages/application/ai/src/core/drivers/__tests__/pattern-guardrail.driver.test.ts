/**
 * Stackra file contract:
 * Purpose: unit tests of `PatternGuardrailDriver`: a match blocks, redacts or flags per stage, a stage without an
 *          effect is skipped, a clean text passes, repeated checks give the same answer, and a broken pattern throws
 *          when the driver is built.
 * Boundary: test only; the rules are in-test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4); STA-1377 (stackra-219).
 */
import { describe, expect, it } from "@stackra/testing";

import { PatternGuardrailDriver } from "#core/drivers/pattern-guardrail.driver";
import { GuardrailEffect } from "#core/enums/guardrail-effect.enum";

const rules = [
  { name: "competitor", pattern: "acme\\s+corp", flags: "i" },
  { name: "secret_word", pattern: "swordfish", replacement: "***" },
];

describe("PatternGuardrailDriver", () => {
  it("blocks on the first matching rule", () => {
    const layer = new PatternGuardrailDriver({ rules, stages: { output: GuardrailEffect.Block } });
    expect(layer.name).toBe("pattern");
    expect(layer.check("Try ACME Corp instead", "output")).toEqual({
      pass: false,
      reason: "competitor",
    });
  });

  it("redacts every match and flags the rules", () => {
    const layer = new PatternGuardrailDriver({
      name: "denylist",
      rules,
      stages: { input: GuardrailEffect.Redact },
    });
    expect(layer.name).toBe("denylist");
    expect(layer.check("acme corp said swordfish", "input")).toEqual({
      pass: true,
      text: "[competitor] said ***",
      flags: ["competitor", "secret_word"],
    });
  });

  it("flags without changing the text", () => {
    const layer = new PatternGuardrailDriver({ rules, stages: { input: GuardrailEffect.Flag } });
    expect(layer.check("swordfish", "input")).toEqual({ pass: true, flags: ["secret_word"] });
    expect(layer.check("swordfish", "input")).toEqual({ pass: true, flags: ["secret_word"] });
  });

  it("passes clean text and skips a stage without an effect", () => {
    const layer = new PatternGuardrailDriver({ rules, stages: { input: GuardrailEffect.Block } });
    expect(layer.check("hello", "input")).toEqual({ pass: true });
    expect(layer.check("swordfish", "output")).toEqual({ pass: true });
  });

  it("refuses a broken pattern when built", () => {
    expect(
      () => new PatternGuardrailDriver({ rules: [{ name: "bad", pattern: "(" }], stages: {} }),
    ).toThrow(SyntaxError);
  });
});
