/**
 * Stackra file contract:
 * Purpose: unit tests of `concatBytes`: chunks joined end to end into a new array, and no chunks give an empty one.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0413.
 */
import { describe, expect, it } from "@stackra/testing";

import { concatBytes } from "#contracts/functions/concat-bytes.function";

describe("concatBytes", () => {
  it("joins chunks in order", () => {
    expect(concatBytes([new Uint8Array([1]), new Uint8Array([2, 3])])).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(concatBytes([])).toEqual(new Uint8Array());
  });
});
