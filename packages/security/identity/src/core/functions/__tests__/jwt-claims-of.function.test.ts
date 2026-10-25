/**
 * Stackra file contract:
 * Purpose: unit tests of `jwtClaimsOf`: the payload of a JWT decoded as UTF-8 JSON (an Arabic name survives), and a
 *          token that is not three parts, not base64url JSON, or not an object is refused `unauthenticated`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 7519.
 */
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { base64UrlOf } from "#core/functions/base64-url-of.function";
import { jwtClaimsOf } from "#core/functions/jwt-claims-of.function";

/** The base64url JSON of one JWT part. */
function part(value: unknown): string {
  return base64UrlOf(new TextEncoder().encode(JSON.stringify(value)));
}

/** An unsigned JWT with `payload`. */
function jwt(payload: unknown): string {
  return `${part({ alg: "RS256" })}.${part(payload)}.signature`;
}

describe("jwtClaimsOf", () => {
  it("decodes the payload as UTF-8 JSON", () => {
    expect(jwtClaimsOf(jwt({ sub: "1", name: "رنا" }))).toEqual({ sub: "1", name: "رنا" });
  });

  it.each([
    ["two parts", "a.b"],
    ["a payload that is not base64url JSON", "a.%%%.c"],
    ["a payload that is an array", jwt([1, 2])],
    ["a payload that is null", jwt(null)],
  ])("refuses %s", (_case, token) => {
    expect(() => jwtClaimsOf(token)).toThrow(UnauthenticatedError);
  });
});
