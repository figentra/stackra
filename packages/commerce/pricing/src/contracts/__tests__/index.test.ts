/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the `TaxProvider` port is its one runtime export, and the
 *          request, line, address, quote and taxed-line types resolve.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 15).
 */
import type { Money } from "@stackra/money";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";
import type { TaxAddress, TaxLine, TaxQuote, TaxRequest, TaxedLine } from "#contracts/index";

describe("@stackra/pricing/contracts", () => {
  it("exports exactly the port at run time", () => {
    expect(Object.keys(contracts)).toEqual(["TaxProvider"]);
  });

  it("types the request and the quote", () => {
    expectTypeOf<TaxRequest["destination"]>().toEqualTypeOf<TaxAddress>();
    expectTypeOf<TaxRequest["lines"]>().toEqualTypeOf<readonly TaxLine[]>();
    expectTypeOf<TaxQuote["lines"]>().toEqualTypeOf<readonly TaxedLine[]>();
    expectTypeOf<TaxQuote["total"]>().toEqualTypeOf<Money>();
    expectTypeOf<TaxedLine["rate"]>().toEqualTypeOf<string>();
  });
});
