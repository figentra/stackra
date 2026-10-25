/**
 * Stackra file contract:
 * Purpose: unit and type tests of `brand`: the constructor returns its argument unchanged, takes exactly the base
 *          type, and is the only way to get the branded type from a plain value.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { brand } from "#core/functions/brand.function";
import type { Branded } from "#core/types/branded.type";

type MemberId = Branded<string, "loyalty_kit.MemberId">;
type Points = Branded<number, "loyalty_kit.Points">;

const memberId = brand<MemberId>();
const points = brand<Points>();

describe("brand", () => {
  it("returns the value unchanged", () => {
    expect(memberId("usr_01j9z3k4m5n6p7q8r9s0t1v2w3")).toBe("usr_01j9z3k4m5n6p7q8r9s0t1v2w3");
    expect(points(120)).toBe(120);
  });

  it("gives the branded type, which a plain value does not have", () => {
    const member: MemberId = memberId("usr_a");
    // @ts-expect-error -- a plain string is not a member id
    const plain: MemberId = "usr_a";
    expect(member).toBe(plain);
  });

  it("takes exactly the base type", () => {
    // @ts-expect-error -- a member id is made from a string, not a number
    const fromNumber = memberId(42);
    // @ts-expect-error -- points are made from a number, not a string
    const fromString = points("120");
    expect([fromNumber, fromString]).toEqual([42, "120"]);
  });
});
