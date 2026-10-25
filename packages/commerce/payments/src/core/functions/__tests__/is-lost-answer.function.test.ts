/**
 * Stackra file contract:
 * Purpose: unit tests of `isLostAnswer`: a provider that did not answer is a lost answer; a provider that refused,
 *          and any other error, is not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0357 (decision 6).
 */
import { ProviderRefusedError, ProviderUnavailableError } from "@stackra/integrations";
import { describe, expect, it } from "@stackra/testing";

import { isLostAnswer } from "#core/functions/is-lost-answer.function";

describe("isLostAnswer", () => {
  it("is true only for an unavailable provider", () => {
    expect(isLostAnswer(ProviderUnavailableError.create({ provider: "stripe" }))).toBe(true);
    expect(isLostAnswer(ProviderRefusedError.create({ provider: "stripe", status: 402 }))).toBe(
      false,
    );
    expect(isLostAnswer(new Error("boom"))).toBe(false);
  });
});
