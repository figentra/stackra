/**
 * Stackra file contract:
 * Purpose: unit tests of `providerCodeOf`: the provider's machine code is found at the top or inside `error`, and a
 *          message sentence is never taken.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 13 and 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { providerCodeOf } from "#core/functions/provider-code-of.function";

describe("providerCodeOf", () => {
  it("reads the code under its usual keys", () => {
    expect(
      providerCodeOf({
        statusCode: 401,
        name: "restricted_api_key",
        message: "This key is restricted",
      }),
    ).toBe("restricted_api_key");
    expect(providerCodeOf({ error: "invalid_grant", error_description: "Bad code" })).toBe(
      "invalid_grant",
    );
    expect(providerCodeOf({ error: { type: "card_error", code: "card_declined" } })).toBe(
      "card_declined",
    );
    expect(providerCodeOf({ code: 20003 })).toBe("20003");
  });

  it("takes no sentence and nothing from a non-object", () => {
    expect(providerCodeOf({ error: "The token for user@acme.example expired" })).toBeUndefined();
    expect(providerCodeOf("plain text")).toBeUndefined();
    expect(providerCodeOf(undefined)).toBeUndefined();
  });
});
