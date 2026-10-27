/**
 * Stackra file contract:
 * Purpose: unit tests of `GS1_APPLICATION_IDENTIFIERS`: the table is frozen, no two-digit key prefixes a three-digit
 *          one (the parser tries two digits first), and the weight and price families carry four-digit identifiers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the GS1 General Specifications; STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { GS1_APPLICATION_IDENTIFIERS } from "#core/constants/gs1-application-identifiers.constant";

describe("GS1_APPLICATION_IDENTIFIERS", () => {
  it("is frozen and unambiguous", () => {
    expect(Object.isFrozen(GS1_APPLICATION_IDENTIFIERS)).toBe(true);
    const keys = Object.keys(GS1_APPLICATION_IDENTIFIERS);
    const short = keys.filter((key) => key.length === 2);
    for (const long of keys.filter((key) => key.length === 3))
      expect(short).not.toContain(long.slice(0, 2));
  });

  it("lays out the identity, weight and price identifiers", () => {
    expect(GS1_APPLICATION_IDENTIFIERS["01"]).toEqual({
      digits: 2,
      length: 14,
      isFixed: true,
      isText: false,
    });
    expect(GS1_APPLICATION_IDENTIFIERS["31"]?.digits).toBe(4);
    expect(GS1_APPLICATION_IDENTIFIERS["392"]).toEqual({
      digits: 4,
      length: 15,
      isFixed: false,
      isText: false,
    });
  });
});
