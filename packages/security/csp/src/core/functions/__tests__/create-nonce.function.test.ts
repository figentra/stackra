/**
 * Stackra file contract:
 * Purpose: unit tests of `createNonce`: 16 random bytes as base64 (24 characters), accepted by
 *          `contentSecurityPolicy`, and a different value on every call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { describe, expect, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { CSP_NONCE_PATTERN } from "#core/constants/csp-nonce-pattern.constant";
import { contentSecurityPolicy } from "#core/functions/content-security-policy.function";
import { createNonce } from "#core/functions/create-nonce.function";

describe("createNonce", () => {
  it("encodes 128 bits as base64", () => {
    const nonce = createNonce();
    expect(nonce).toHaveLength(24);
    expect(nonce).toMatch(CSP_NONCE_PATTERN);
    expect(atob(nonce)).toHaveLength(16);
  });

  it("mints a nonce the policy accepts", () => {
    const nonce = createNonce();
    expect(contentSecurityPolicy(new CspConfig(), { nonce })).toContain(`'nonce-${nonce}'`);
  });

  it("never repeats", () => {
    const nonces = new Set(Array.from({ length: 1_000 }, () => createNonce()));
    expect(nonces.size).toBe(1_000);
  });
});
