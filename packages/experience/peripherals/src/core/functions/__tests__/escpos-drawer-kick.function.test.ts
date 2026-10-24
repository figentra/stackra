/**
 * Stackra file contract:
 * Purpose: unit tests of `escposDrawerKick`: `ESC p` with `m` 0 for pin 2 and 1 for pin 5, 50 ms on, 500 ms off.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { escposDrawerKick } from "#core/functions/escpos-drawer-kick.function";

describe("escposDrawerKick", () => {
  it("pulses pin 2 or pin 5", () => {
    expect([...escposDrawerKick(2)]).toEqual([0x1b, 0x70, 0, 25, 250]);
    expect([...escposDrawerKick(5)]).toEqual([0x1b, 0x70, 1, 25, 250]);
  });
});
