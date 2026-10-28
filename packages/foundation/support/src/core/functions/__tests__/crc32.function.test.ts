/**
 * Stackra file contract:
 * Purpose: unit tests of `crc32`: the IEEE check value, and the same checksum whether the bytes come in one chunk or
 *          several, and a string read as its UTF-8 bytes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); APPNOTE.TXT 4.4.7; stackra-224 (moved from data-transfer,
 *                     string case from identity).
 */
import { describe, expect, it } from "@stackra/testing";

import { crc32 } from "#core/functions/crc32.function";

describe("crc32", () => {
  const bytes = new TextEncoder().encode("123456789");

  it("gives the IEEE check value", () => {
    expect(crc32(bytes)).toBe(0xcb_f4_39_26);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("reads a string as its UTF-8 bytes", () => {
    expect(crc32("123456789")).toBe(0xcb_f4_39_26);
    expect(crc32("é")).toBe(crc32(new TextEncoder().encode("é")));
  });

  it("continues across chunks", () => {
    expect(crc32(bytes.subarray(4), crc32(bytes.subarray(0, 4)))).toBe(0xcb_f4_39_26);
  });
});
