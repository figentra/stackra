/**
 * Stackra file contract:
 * Purpose: unit tests of `CSP_NONCE_PATTERN`: base64 and base64url nonces match; a quote, a space, a `;` or more than
 *          two padding signs do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { describe, expect, it } from "@stackra/testing";

import { CSP_NONCE_PATTERN } from "#core/constants/csp-nonce-pattern.constant";

describe("CSP_NONCE_PATTERN", () => {
  it.each([["q2Xr0f8bT1k1m3c5H0pW9A=="], ["abc+/def"], ["abc-_def"], ["YQ="]])(
    "matches %j",
    (nonce) => {
      expect(CSP_NONCE_PATTERN.test(nonce)).toBe(true);
    },
  );

  it.each([["abc'"], ["abc def"], ["abc;"], ["abc==="], ["=="], [""]])("refuses %j", (nonce) => {
    expect(CSP_NONCE_PATTERN.test(nonce)).toBe(false);
  });
});
