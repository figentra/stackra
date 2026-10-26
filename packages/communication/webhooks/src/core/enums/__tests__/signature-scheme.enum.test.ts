/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureScheme`: Standard Webhooks is the one scheme, under the code the integrations
 *          package documents (`standard_webhooks`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0224 (decision 2); ADR 0308 (rule 15).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SignatureScheme } from "#core/enums/signature-scheme.enum";

describe("SignatureScheme", () => {
  it("holds Standard Webhooks and the data-driven HMAC scheme", () => {
    expect(Enum.values(SignatureScheme)).toEqual(["standard_webhooks", "hmac"]);
    expect(SignatureScheme.StandardWebhooks).toBe("standard_webhooks");
    expect(SignatureScheme.Hmac).toBe("hmac");
  });

  it("types a scheme as its code", () => {
    expectTypeOf<SignatureScheme>().toEqualTypeOf<"standard_webhooks" | "hmac">();
  });
});
