/**
 * Stackra file contract:
 * Purpose: unit tests of `AppOverloadedError`: a retryable `unavailable` refusal with the derived code `app_overloaded`
 *          whose envelope carries only the wait it asks for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; STA-1467.
 */
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AppOverloadedError } from "#server/errors/app-overloaded.error";

describe("AppOverloadedError", () => {
  it("is a retryable unavailable refusal coded app_overloaded with its wait", () => {
    const error = AppOverloadedError.create({ retryAfterMs: 1000 });
    expect(isRefusal(error, AppOverloadedError)).toBe(true);
    expect(error.kind).toBe("unavailable");
    expect(error.retryable).toBe(true);
    expect(error.code).toBe("app_overloaded");
    expect(error.retryAfterMs).toBe(1000);
    expect(error.toEnvelope()).toMatchObject({
      code: "app_overloaded",
      category: "unavailable",
      retryable: true,
    });
  });
});
