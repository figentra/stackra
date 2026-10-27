/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientRefusal`: the code inside the options gives the same refusal class as `refusalRef`,
 *          with its message key.
 * Boundary: test only; the refusal restates the template's generated `apps/web` marketing client.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (refusals).
 */
import { isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import type { I18nKey } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { ClientRefusal } from "#core/bases/client-refusal.base";

const MESSAGE = "leads::refusals.rate_limited" as I18nKey;

class RateLimitedError extends ClientRefusal({
  code: "leads.rate_limited",
  message: MESSAGE,
}) {}

describe("ClientRefusal", () => {
  it("is a refusal class with the producer's code and message key", () => {
    const error = refusal(RateLimitedError);
    expect(isRefusal(error, RateLimitedError)).toBe(true);
    expect(error.code).toBe("rate_limited");
    expect(error.refusalKey).toBe(MESSAGE);
    expect(RateLimitedError.qualifiedCode).toBe("leads.rate_limited");
  });
});
