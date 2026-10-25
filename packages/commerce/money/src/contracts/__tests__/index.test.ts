/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `RateSource` port is its one runtime export, and the
 *          pair and snapshot types its signature names resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { RatePair, RateSnapshot } from "#contracts/index";

describe("@stackra/money/contracts", () => {
  it("exports exactly the port at run time", () => {
    expect(Object.keys(contracts)).toEqual(["RateSource"]);
  });

  it("types a snapshot as a pair with its rate, source and instant", () => {
    expectTypeOf<RatePair>().toEqualTypeOf<{
      readonly base: string;
      readonly quote: string;
      readonly unit: string | null;
    }>();
    expectTypeOf<RateSnapshot>().toMatchTypeOf<RatePair>();
    expectTypeOf<RateSnapshot["rate"]>().toEqualTypeOf<string>();
    expectTypeOf<RateSnapshot["at"]>().toEqualTypeOf<Date>();
  });
});
