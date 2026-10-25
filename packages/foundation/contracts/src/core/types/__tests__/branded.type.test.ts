/**
 * Stackra file contract:
 * Purpose: type tests of `Branded`: a branded value is still usable as its base, but neither a plain base value nor a
 *          value of another brand stands in for it.
 * Boundary: test only; the assertions are compile-time (`@ts-expect-error`) plus runtime checks of the same values.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Branded } from "#core/types/branded.type";

type MemberId = Branded<string, "loyalty_kit.MemberId">;
type ProductId = Branded<string, "catalogue.ProductId">;

describe("Branded", () => {
  it("is its base at runtime and in reads", () => {
    const member = "usr_a" as MemberId;
    const asText: string = member;
    expect(asText.toUpperCase()).toBe("USR_A");
  });

  it("refuses a plain base value and another brand", () => {
    // @ts-expect-error -- a plain string is not a member id
    const plain: MemberId = "usr_a";
    const product = "prd_a" as ProductId;
    // @ts-expect-error -- a product id is not a member id
    const swapped: MemberId = product;
    expect([plain, swapped]).toEqual(["usr_a", "prd_a"]);
  });

  it("records its brand name and base in the type only", () => {
    const name: MemberId["~brand"]["name"] = "loyalty_kit.MemberId";
    expect(name).toBe("loyalty_kit.MemberId");
    expect(typeof ("usr_a" as MemberId)).toBe("string");
  });
});
