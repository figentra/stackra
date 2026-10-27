/**
 * Stackra file contract:
 * Purpose: unit tests of `approvalNumbers`: the number is among the choices, every choice has the digit count and is
 *          distinct, the decoy count holds, and digits too few for the decoys refuse.
 * Boundary: test only; real Web Crypto, so each case runs many times.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-1304.
 */
import { describe, expect, it } from "@stackra/testing";

import { approvalNumbers } from "#core/functions/approval-numbers.function";

describe("approvalNumbers", () => {
  it("offers the number among distinct two-digit decoys", () => {
    for (let run = 0; run < 200; run += 1) {
      const { number, choices } = approvalNumbers(2, 3);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(number);
      for (const choice of choices) {
        expect(choice).toBeGreaterThanOrEqual(10);
        expect(choice).toBeLessThanOrEqual(99);
      }
    }
  });

  it("does not always put the number first", () => {
    const firsts = new Set<boolean>();
    for (let run = 0; run < 100; run += 1) {
      const { number, choices } = approvalNumbers(2, 3);
      firsts.add(choices[0] === number);
    }
    expect(firsts).toEqual(new Set([true, false]));
  });

  it("refuses more decoys than the digits hold", () => {
    expect(() => approvalNumbers(1, 9)).toThrow(RangeError);
  });
});
