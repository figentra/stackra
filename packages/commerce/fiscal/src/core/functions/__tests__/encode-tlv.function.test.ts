/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeTlv`: tag, byte length and value per field, UTF-8 lengths, and the one-byte limits.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeTlv } from "#core/functions/encode-tlv.function";

describe("encodeTlv", () => {
  it("writes tag, length and value in order", () => {
    expect([
      ...encodeTlv([
        [1, "A"],
        [2, "BC"],
        [9, new Uint8Array([7])],
      ]),
    ]).toEqual([1, 1, 65, 2, 2, 66, 67, 9, 1, 7]);
  });

  it("counts UTF-8 bytes, not characters", () => {
    expect([...encodeTlv([[1, "é"]])]).toEqual([1, 2, 0xc3, 0xa9]);
  });

  it("refuses a tag outside one byte and a value over 255 bytes", () => {
    expect(() => encodeTlv([[0, "A"]])).toThrow(RangeError);
    expect(() => encodeTlv([[256, "A"]])).toThrow(RangeError);
    expect(() => encodeTlv([[1, "x".repeat(256)]])).toThrow(RangeError);
  });
});
