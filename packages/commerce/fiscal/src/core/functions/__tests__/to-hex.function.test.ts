/**
 * Stackra file contract:
 * Purpose: unit tests of `toHex`: two lower-case digits per byte.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { toHex } from "#core/functions/to-hex.function";

describe("toHex", () => {
  it("pads and lower-cases", () => {
    expect(toHex(new Uint8Array([0, 10, 255]))).toBe("000aff");
    expect(toHex(new Uint8Array())).toBe("");
  });
});
