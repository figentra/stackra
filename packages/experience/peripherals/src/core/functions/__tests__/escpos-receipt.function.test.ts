/**
 * Stackra file contract:
 * Purpose: unit tests of `escposReceipt`: initialise, each line and a line feed, then a 4-line feed and a partial cut;
 *          control bytes and characters outside printable ASCII print as `?`, so a line cannot carry a command.
 * Boundary: test only; the expected bytes are the ESC/POS commands spelled out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { escposReceipt } from "#core/functions/escpos-receipt.function";

/** Initialise, and feed 4 lines then cut partially. */
const INIT = [0x1b, 0x40];
const FEED_AND_CUT = [0x1b, 0x64, 4, 0x1d, 0x56, 0x01];

describe("escposReceipt", () => {
  it("prints each line and cuts", () => {
    expect([...escposReceipt(["Hi", "12.00"])]).toEqual([
      ...INIT,
      0x48,
      0x69,
      0x0a,
      0x31,
      0x32,
      0x2e,
      0x30,
      0x30,
      0x0a,
      ...FEED_AND_CUT,
    ]);
  });

  it("cuts an empty receipt", () => {
    expect([...escposReceipt([])]).toEqual([...INIT, ...FEED_AND_CUT]);
  });

  it("prints control bytes and other scripts as ?", () => {
    expect([...escposReceipt(["a\u001bp\u0000é😀"])]).toEqual([
      ...INIT,
      0x61,
      0x3f,
      0x70,
      0x3f,
      0x3f,
      0x3f,
      0x0a,
      ...FEED_AND_CUT,
    ]);
  });
});
