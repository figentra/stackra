/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `TaxProvider` port: a port base keyed `pricing.TaxProvider` that its memory
 *          driver is an instance of.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { TaxProvider } from "#contracts/ports/tax-provider.port";
import type { TaxQuote } from "#contracts/types/tax-quote.type";
import { MemoryTaxProviderDriver } from "#core/drivers/memory-tax-provider.driver";

describe("TaxProvider", () => {
  it("is a port its drivers are instances of", () => {
    const tax = new MemoryTaxProviderDriver();
    expect(tax).toBeInstanceOf(TaxProvider);
    expect(tax).toBeInstanceOf(Port);
  });

  it("is keyed pricing.TaxProvider and answers a quote", () => {
    expectTypeOf<TaxProvider["~key"]>().toEqualTypeOf<"pricing.TaxProvider">();
    expectTypeOf<TaxProvider["quote"]>().returns.toEqualTypeOf<Promise<TaxQuote>>();
  });
});
