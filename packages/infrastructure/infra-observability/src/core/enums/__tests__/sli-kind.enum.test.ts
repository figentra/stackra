/**
 * Stackra file contract:
 * Purpose: unit tests of `SliKind`: availability and latency, the two indicators every service gets.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0184 (decision 3); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { SliKind } from "#core/enums/sli-kind.enum";

describe("SliKind", () => {
  it("lists availability and latency", () => {
    expect(Enum.values(SliKind)).toEqual(["availability", "latency"]);
    expectTypeOf<SliKind>().toEqualTypeOf<"availability" | "latency">();
  });
});
