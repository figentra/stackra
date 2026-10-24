/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeBase64`: decodes standard base64, ignores line breaks, throws on non-base64 text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { decodeBase64 } from "#core/functions/decode-base64.function";

describe("decodeBase64", () => {
  it("decodes standard base64", () => {
    expect(Array.from(decodeBase64("aGk="))).toEqual([104, 105]);
  });

  it("ignores whitespace and line breaks", () => {
    expect(new TextDecoder().decode(decodeBase64("aGVs\nbG8g\r\nd29y bGQ="))).toBe("hello world");
  });

  it("throws on text that is not base64", () => {
    expect(() => decodeBase64("%%%")).toThrow();
  });
});
