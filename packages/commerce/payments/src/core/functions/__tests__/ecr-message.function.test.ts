/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeEcrMessage` and `decodeEcrMessage`: fields in the profile's order with empty gaps, a
 *          value holding the separator refused, and an answer read by position with blanks and missing fields left out.
 * Boundary: test only; the profile is an illustrative fixture, not a provider's certified layout.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0377 (decisions 1 and 9).
 */
import { describe, expect, it } from "@stackra/testing";

import { EcrOutcome } from "#contracts/enums/ecr-outcome.enum";
import type { EcrProfile } from "#contracts/types/ecr-profile.type";
import { decodeEcrMessage } from "#core/functions/decode-ecr-message.function";
import { encodeEcrMessage } from "#core/functions/encode-ecr-message.function";

const profile: EcrProfile = {
  provider: "fixture",
  certification: "pending",
  operations: { sale: "01", refund: "02", inquiry: "09", cancel: "99" },
  separator: "|",
  request: ["operation", "reference", "amount", "blank", "tip_percentages"],
  response: ["operation", "reference", "result", "blank", "amount", "tip"],
  results: { "00": EcrOutcome.Approved },
  timing: { answerMs: 120_000, ackMs: 2000, retries: 3 },
};

describe("encodeEcrMessage", () => {
  it("writes the fields in order, a missing one empty", () => {
    const bytes = encodeEcrMessage(profile, {
      operation: "01",
      reference: "chk_9",
      amount: "2500",
    });
    expect(new TextDecoder().decode(bytes)).toBe("01|chk_9|2500||");
  });

  it("refuses a value holding the separator", () => {
    expect(() => encodeEcrMessage(profile, { reference: "a|b" })).toThrow(RangeError);
  });
});

describe("decodeEcrMessage", () => {
  it("reads by position, trimming, and leaves out blanks and missing fields", () => {
    const answer = decodeEcrMessage(profile, new TextEncoder().encode("01|chk_9 |00|XX|2750"));
    expect(answer).toEqual({ operation: "01", reference: "chk_9", result: "00", amount: "2750" });
  });
});
