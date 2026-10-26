/**
 * Stackra file contract:
 * Purpose: unit tests of `derToP1363`: short integers are left-padded, a leading sign byte is dropped, and anything
 *          that is not one DER sequence of two integers is refused.
 * Boundary: test only; hand-built DER.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0416.
 */
import { describe, expect, it } from "@stackra/testing";

import { derToP1363 } from "#core/functions/der-to-p1363.function";

/** DER of the two integers. */
const der = (r: number[], s: number[]) =>
  new Uint8Array([0x30, 4 + r.length + s.length, 0x02, r.length, ...r, 0x02, s.length, ...s]);

describe("derToP1363", () => {
  it("left-pads short integers and drops a leading zero", () => {
    expect([...derToP1363(der([0x01], [0x00, 0x80, 0x02]), 2)]).toEqual([0x00, 0x01, 0x80, 0x02]);
  });

  it("refuses what is not a DER ECDSA signature", () => {
    expect(() => derToP1363(new Uint8Array([0x31, 0]), 2)).toThrow(RangeError);
    expect(() => derToP1363(der([1, 2, 3], [1]), 2)).toThrow(RangeError);
    expect(() => derToP1363(new Uint8Array([0x30, 3, 0x02, 5, 1]), 2)).toThrow(RangeError);
    expect(() => derToP1363(new Uint8Array([0x30, 2, 0x04, 0]), 2)).toThrow(RangeError);
  });
});
