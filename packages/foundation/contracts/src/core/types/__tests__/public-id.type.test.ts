/**
 * Stackra file contract:
 * Purpose: type tests of `PublicId`: the prefix is checked at compile time, ids of two prefixes never mix, and the
 *          bare form takes an id of any prefix.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0135 (format).
 */
import { describe, expect, it } from "@stackra/testing";

import type { PublicId } from "#core/types/public-id.type";

const ORDER = "ord_01j9z3k4m5n6p7q8r9s0t1v2w3";
const USER = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

describe("PublicId", () => {
  it("accepts an id of its prefix", () => {
    const order: PublicId<"ord"> = ORDER;
    expect(order.startsWith("ord_")).toBe(true);
  });

  it("refuses an id of another prefix, and an unprefixed value", () => {
    // @ts-expect-error -- a user id is not an order id
    const wrongPrefix: PublicId<"ord"> = USER;
    // @ts-expect-error -- a database id is never a public id
    const raw: PublicId<"ord"> = "01j9z3k4m5n6p7q8r9s0t1v2w3";
    expect([wrongPrefix, raw]).toHaveLength(2);
  });

  it("keeps two prefixes apart and lets the bare form take any", () => {
    const user: PublicId<"usr"> = USER;
    // @ts-expect-error -- prefixes never mix
    const order: PublicId<"ord"> = user;
    const anyPrefix: PublicId = user;
    expect([order, anyPrefix]).toEqual([USER, USER]);
  });
});
