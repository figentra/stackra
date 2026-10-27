/**
 * Stackra file contract:
 * Purpose: unit tests of `SignatureScheme`: the exact set of codes, Standard Webhooks under the code the integrations
 *          package documents (`standard_webhooks`), the data-driven HMAC and the six regional gateway schemes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0224 (decision 2); ADR 0308 (rule 15).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SignatureScheme } from "#core/enums/signature-scheme.enum";

describe("SignatureScheme", () => {
  it("holds Standard Webhooks, the data-driven HMAC scheme and the regional gateway schemes", () => {
    expect(Enum.values(SignatureScheme)).toEqual([
      "standard_webhooks",
      "hmac",
      "body_token",
      "aes_gcm_body",
      "ordered_field_hmac",
      "keyed_field_digest",
      "shared_header",
      "jwt_hs256",
    ]);
    expect(SignatureScheme.StandardWebhooks).toBe("standard_webhooks");
    expect(SignatureScheme.Hmac).toBe("hmac");
  });

  it("types a scheme as its code", () => {
    expectTypeOf<SignatureScheme>().toEqualTypeOf<
      | "standard_webhooks"
      | "hmac"
      | "body_token"
      | "aes_gcm_body"
      | "ordered_field_hmac"
      | "keyed_field_digest"
      | "shared_header"
      | "jwt_hs256"
    >();
  });
});
