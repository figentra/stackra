/**
 * Stackra file contract:
 * Purpose: unit tests of `PiiGuardrailDriver`: emails and phones by rule and identity numbers by market format
 *          (spaced, hyphenated and Arabic-Indic digits included) are redacted, flagged or blocked per stage; a number
 *          that fails the check digit and a stage without an effect pass; reasons never hold the matched text.
 * Boundary: test only; the rules and formats are in-test data shaped like the platform floor and a market pack.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 4); ADR 0360 (decision 15); STA-1377.
 */
import { describe, expect, it } from "@stackra/testing";
import { IdentifierCheck } from "@stackra/validation";

import { PiiGuardrailDriver } from "#core/drivers/pii-guardrail.driver";
import { GuardrailEffect } from "#core/enums/guardrail-effect.enum";

const rules = [
  { name: "email", pattern: "[^\\s@]+@[^\\s@]+\\.[A-Za-z]{2,}" },
  { name: "phone", pattern: "\\+\\d{1,3}[\\s-]?\\d{2,3}[\\s-]?\\d{3}[\\s-]?\\d{4}" },
];
const nationalIds = { national_id: { pattern: "^[12]\\d{9}$", check: IdentifierCheck.Luhn } };

describe("PiiGuardrailDriver", () => {
  it("redacts emails, phones and valid identity numbers", () => {
    const pii = new PiiGuardrailDriver({
      rules,
      nationalIds,
      stages: { input: GuardrailEffect.Redact },
    });
    expect(pii.name).toBe("pii");
    expect(pii.check("Mail a.b@shop.sa or call +966 50 123 4567, ID 1012345672.", "input")).toEqual(
      {
        pass: true,
        text: "Mail [email] or call [phone], ID [national_id].",
        flags: ["email", "phone", "national_id"],
      },
    );
  });

  it("reads spaced, hyphenated and Arabic-Indic identity numbers", () => {
    const pii = new PiiGuardrailDriver({
      rules: [],
      nationalIds,
      stages: { output: GuardrailEffect.Redact },
    });
    expect(pii.check("رقم ١٠١٢٣٤٥٦٧٢ و 1012-345-672", "output")).toEqual({
      pass: true,
      text: "رقم [national_id] و [national_id]",
      flags: ["national_id"],
    });
  });

  it("leaves a number that fails the check digit", () => {
    const pii = new PiiGuardrailDriver({
      rules: [],
      nationalIds,
      stages: { input: GuardrailEffect.Block },
    });
    expect(pii.check("order 1012345673", "input")).toEqual({ pass: true });
  });

  it("blocks or flags with the rule name only", () => {
    const blocking = new PiiGuardrailDriver({ rules, stages: { output: GuardrailEffect.Block } });
    expect(blocking.check("write to a@b.co", "output")).toEqual({ pass: false, reason: "email" });
    const flagging = new PiiGuardrailDriver({
      rules,
      nationalIds,
      stages: { output: GuardrailEffect.Flag },
    });
    expect(flagging.check("ID 1012345672", "output")).toEqual({
      pass: true,
      flags: ["national_id"],
    });
  });

  it("skips a stage without an effect", () => {
    const pii = new PiiGuardrailDriver({ rules, stages: { input: GuardrailEffect.Block } });
    expect(pii.check("a@b.co", "output")).toEqual({ pass: true });
  });
});
