/**
 * Stackra file contract:
 * Purpose: unit tests of `randomToken`: 43 base64url characters, a valid PKCE verifier, different on every call.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 7636 (section 4.1).
 */
import { describe, expect, it } from "@stackra/testing";

import { randomToken } from "#core/functions/random-token.function";

describe("randomToken", () => {
  it("is a 43-character verifier", () => {
    expect(randomToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("differs on every call", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => randomToken()));
    expect(tokens.size).toBe(50);
  });
});
