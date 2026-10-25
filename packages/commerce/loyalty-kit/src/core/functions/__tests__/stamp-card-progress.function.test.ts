/**
 * Stackra file contract:
 * Purpose: unit tests of `stampCardProgress`: a balance read as stamps on the current card and full cards, an empty
 *          card for a negative balance, and the refusals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; the PUT-133 answer.
 */
import { describe, expect, it } from "@stackra/testing";

import { stampCardProgress } from "#core/functions/stamp-card-progress.function";

describe("stampCardProgress", () => {
  it("reads a balance as a card", () => {
    expect(stampCardProgress(23, 10)).toEqual({ stamps: 3, perCard: 10, fullCards: 2 });
    expect(stampCardProgress(10, 10)).toEqual({ stamps: 0, perCard: 10, fullCards: 1 });
    expect(stampCardProgress(0, 8)).toEqual({ stamps: 0, perCard: 8, fullCards: 0 });
    expect(stampCardProgress(-4, 10)).toEqual({ stamps: 0, perCard: 10, fullCards: 0 });
  });

  it("refuses a bad card size or a fractional balance", () => {
    expect(() => stampCardProgress(5, 0)).toThrow(RangeError);
    expect(() => stampCardProgress(5, 2.5)).toThrow(RangeError);
    expect(() => stampCardProgress(1.5, 10)).toThrow(RangeError);
  });
});
