/**
 * Stackra file contract:
 * Purpose: type tests of `Party`: every part is optional, the address is the one `Address`, and a party is read-only.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-1383.
 */
import { describe, expect, it } from "@stackra/testing";

import type { Party } from "#core/types/party.type";

describe("Party", () => {
  it("takes any subset of its parts", () => {
    const empty: Party = {};
    const customer: Party = {
      name: "Sara Ali",
      address: { lines: ["12 King Road"], country: "SA" },
    };
    expect([empty, customer]).toHaveLength(2);
  });

  it("refuses an address in another shape and writes", () => {
    // @ts-expect-error -- the address is `Address` (lines, not line1)
    const old: Party = { address: { line1: "12 King Road", city: "Riyadh", country: "SA" } };
    const party: Party = { name: "A" };
    // @ts-expect-error -- read-only
    party.name = "B";
    expect(old).toBeDefined();
  });
});
