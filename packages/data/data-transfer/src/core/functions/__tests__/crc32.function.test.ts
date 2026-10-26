/**
 * Stackra file contract:
 * Purpose: unit tests of `crc32`: the IEEE check value, and the same checksum whether the bytes come in one chunk or
 *          several.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); APPNOTE.TXT 4.4.7.
 */
import { describe, expect, it } from "@stackra/testing";

import { crc32 } from "#core/functions/crc32.function";

describe("crc32", () => {
  const bytes = new TextEncoder().encode("123456789");

  it("gives the IEEE check value", () => {
    expect(crc32(bytes)).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("continues across chunks", () => {
    expect(crc32(bytes.subarray(4), crc32(bytes.subarray(0, 4)))).toBe(0xcbf43926);
  });
});
