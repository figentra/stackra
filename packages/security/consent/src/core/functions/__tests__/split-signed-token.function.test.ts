/**
 * Stackra file contract:
 * Purpose: unit tests of `splitSignedToken`: a well-formed token splits into its parsed payload, the signed bytes (the
 *          first segment as sent) and the signature with its key id; an oversized token, a wrong segment count, an empty
 *          segment, a segment that is not base64url, a key id that is not UTF-8 and a payload that is not JSON each give
 *          `null` without throwing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decision 2); STA-2818.
 */
import { base64url } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import { splitSignedToken } from "#core/functions/split-signed-token.function";

/** `text` as a base64url segment. */
const segment = (text: string): string => base64url.encode(new TextEncoder().encode(text));

describe("splitSignedToken", () => {
  it("splits a well-formed token", () => {
    const payload = segment('{"kind":"x","n":1}');
    const parts = splitSignedToken(`${payload}.${segment("consent-1")}.c2ln`);
    expect(parts).toEqual({
      payload: { kind: "x", n: 1 },
      message: new TextEncoder().encode(payload),
      signature: { keyId: "consent-1", algorithm: "ES256", value: "c2ln" },
    });
  });

  it("refuses anything that is not a well-formed token, without throwing", () => {
    const payload = segment("{}");
    const key = segment("consent-1");
    for (const token of [
      `${"a".repeat(8193)}`,
      `${payload}.${key}`,
      `${payload}.${key}.c2ln.extra`,
      `.${key}.c2ln`,
      `${payload}..c2ln`,
      `${payload}.${key}.`,
      `${payload}.${key}.%%%`,
      `${payload}.${base64url.encode(new Uint8Array([0xff, 0xfe]))}.c2ln`,
      `${segment("not json")}.${key}.c2ln`,
    ])
      expect(splitSignedToken(token)).toBeNull();
  });
});
