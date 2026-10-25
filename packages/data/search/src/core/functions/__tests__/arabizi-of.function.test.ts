/**
 * Stackra file contract:
 * Purpose: unit tests of `arabiziOf`: common Arabizi words, digraphs, and the words it leaves alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0221 (decision 3); OS-173.
 */
import { describe, expect, it } from "@stackra/testing";

import { arabiziOf } from "#core/functions/arabizi-of.function";

describe(arabiziOf, () => {
  it("spells Arabizi words in Arabic", () => {
    expect(arabiziOf("7abibi")).toBe("حبيبي");
    expect(arabiziOf("3arabi")).toBe("عربي");
    expect(arabiziOf("mar7aba")).toBe("مرحبا");
    expect(arabiziOf("sha3r")).toBe("شعر");
  });

  it("leaves English words and numbers alone", () => {
    expect(arabiziOf("linen")).toBeUndefined();
    expect(arabiziOf("2026")).toBeUndefined();
    expect(arabiziOf("مرحبا")).toBeUndefined();
  });
});
