/**
 * Stackra file contract:
 * Purpose: unit tests of `detectEncoding`: byte order marks win, valid UTF-8 (even cut mid-character) is UTF-8, other
 *          bytes take the caller's fallback, and no fallback is a refusal.
 * Boundary: test only. The fallback label is test data, as a market pack would pass it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { UnreadableEncodingError } from "#core/errors/unreadable-encoding.error";
import { detectEncoding } from "#core/functions/detect-encoding.function";

const LEGACY = "windows-1256";

describe("detectEncoding", () => {
  it("reads byte order marks", () => {
    expect(detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]), LEGACY)).toBe("utf-8");
    expect(detectEncoding(new Uint8Array([0xff, 0xfe, 0x61, 0x00]), LEGACY)).toBe("utf-16le");
    expect(detectEncoding(new Uint8Array([0xfe, 0xff, 0x00, 0x61]), LEGACY)).toBe("utf-16be");
  });

  it("takes valid UTF-8 as UTF-8, also when the sample ends mid-character", () => {
    const arabic = new TextEncoder().encode("الاسم");
    expect(detectEncoding(arabic, LEGACY)).toBe("utf-8");
    expect(detectEncoding(arabic.subarray(0, arabic.length - 1), LEGACY)).toBe("utf-8");
  });

  it("falls back for bytes that are not UTF-8", () => {
    expect(detectEncoding(new Uint8Array([0xc7, 0xe1, 0xc7, 0xd3, 0xe3]), LEGACY)).toBe(LEGACY);
  });

  it("refuses without a fallback", () => {
    expect(() => detectEncoding(new Uint8Array([0xc7, 0xe1]))).toThrow(UnreadableEncodingError);
  });
});
