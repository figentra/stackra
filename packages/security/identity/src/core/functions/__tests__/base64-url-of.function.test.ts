/**
 * Stackra file contract:
 * Purpose: unit tests of `base64UrlOf`: the URL-safe alphabet, no padding, and the empty input.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; RFC 4648 (section 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { base64UrlOf } from "#core/functions/base64-url-of.function";

describe("base64UrlOf", () => {
  it("uses - and _ and drops the padding", () => {
    expect(base64UrlOf(new Uint8Array([251, 255]))).toBe("-_8");
    expect(base64UrlOf(new TextEncoder().encode("Man"))).toBe("TWFu");
    expect(base64UrlOf(new TextEncoder().encode("Ma"))).toBe("TWE");
  });

  it("encodes nothing as nothing", () => {
    expect(base64UrlOf(new Uint8Array())).toBe("");
  });
});
