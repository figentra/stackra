/**
 * Stackra file contract:
 * Purpose: unit tests of `requestCallOptions`: both headers lifted as sent, case-insensitively, and missing or empty
 *          ones left out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0138; ADR 0472 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { CALL_HEADERS } from "#contracts/constants/call-headers.constant";
import { requestCallOptions } from "#core/functions/request-call-options.function";

describe(requestCallOptions, () => {
  it("lifts the Idempotency-Key and Stackra-Consent headers as sent", () => {
    const request = new Request("https://api.example.com/orders", {
      method: "POST",
      headers: { "idempotency-key": "key_1", "stackra-consent": "payload.kid.signature" },
    });
    expect(requestCallOptions(request)).toEqual({
      idempotencyKey: "key_1",
      consentSnapshot: "payload.kid.signature",
    });
  });

  it("leaves out a missing or empty header", () => {
    const request = new Request("https://api.example.com/orders", {
      headers: { [CALL_HEADERS.consentSnapshot]: "" },
    });
    expect(requestCallOptions(request)).toEqual({});
  });

  it("names the headers once", () => {
    expect(CALL_HEADERS).toEqual({
      idempotencyKey: "Idempotency-Key",
      consentSnapshot: "Stackra-Consent",
    });
    expect(Object.isFrozen(CALL_HEADERS)).toBe(true);
  });
});
