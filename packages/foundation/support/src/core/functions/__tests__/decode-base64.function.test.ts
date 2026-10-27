/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeBase64`: decodes standard base64, ignores whitespace and line breaks, and answers
 *          `undefined` for text that is not base64 (it never throws).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; stackra-224 (moved from licensing).
 */
import { describe, expect, it } from "@stackra/testing";

import { decodeBase64 } from "#core/functions/decode-base64.function";

describe("decodeBase64", () => {
  it("decodes standard base64", () => {
    expect(Array.from(decodeBase64("aGk=") ?? [])).toEqual([104, 105]);
  });

  it("ignores whitespace and line breaks", () => {
    expect(new TextDecoder().decode(decodeBase64("aGVs\nbG8g\r\nd29y bGQ="))).toBe("hello world");
  });

  it("answers undefined for text that is not base64", () => {
    expect(decodeBase64("%%%")).toBeUndefined();
    expect(decodeBase64("not base64!")).toBeUndefined();
  });
});
