/**
 * Stackra file contract:
 * Purpose: unit tests of `redact`: every match of each rule is replaced, in rule order, with the rule's replacement or
 *          `[<name>]`; extra flags apply; an invalid pattern throws instead of letting text through.
 * Boundary: test only; the patterns are test data, not a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0360 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { redact } from "#core/functions/redact.function";

describe("redact", () => {
  it("replaces every match of each rule", () => {
    expect(
      redact("mail a@b.co or c@d.co, card 4111 1111 1111 1111", [
        { name: "email", pattern: "[^\\s@,]+@[^\\s@,]+" },
        { name: "card", pattern: "\\b(?:\\d[ -]?){13,19}\\b", replacement: "****" },
      ]),
    ).toBe("mail [email] or [email], card ****");
  });

  it("applies extra flags", () => {
    expect(redact("ID AB123", [{ name: "id", pattern: "ab\\d+", flags: "i" }])).toBe("ID [id]");
  });

  it("throws on an invalid rule", () => {
    expect(() => redact("x", [{ name: "bad", pattern: "(" }])).toThrow(SyntaxError);
  });
});
