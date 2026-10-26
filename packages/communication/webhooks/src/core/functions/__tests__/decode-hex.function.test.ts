/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeHex`: it reads an even run of hex digits in either case and answers `undefined` for
 *          anything else.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { decodeHex } from "#core/functions/decode-hex.function";

describe("decodeHex", () => {
  it("reads hex in either case", () => {
    expect(Array.from(decodeHex("CAfe00") ?? [])).toEqual([0xca, 0xfe, 0x00]);
  });

  it("answers undefined for an odd, empty or non-hex text", () => {
    expect(decodeHex("caf")).toBeUndefined();
    expect(decodeHex("")).toBeUndefined();
    expect(decodeHex("zz")).toBeUndefined();
  });
});
