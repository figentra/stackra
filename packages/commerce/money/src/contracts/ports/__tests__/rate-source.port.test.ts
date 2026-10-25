/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `RateSource` port: a port base keyed `money.RateSource` that its memory driver
 *          is an instance of, answering a snapshot for a pair and an instant.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); ADR 0220.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { RateSource } from "#contracts/ports/rate-source.port";
import type { RateSnapshot } from "#contracts/types/rate-snapshot.type";
import { MemoryRateSourceDriver } from "#core/drivers/memory-rate-source.driver";

describe("RateSource", () => {
  it("is a port its drivers are instances of", () => {
    const rates = new MemoryRateSourceDriver();
    expect(rates).toBeInstanceOf(RateSource);
    expect(rates).toBeInstanceOf(Port);
  });

  it("is keyed money.RateSource and answers a snapshot", () => {
    expectTypeOf<RateSource["~key"]>().toEqualTypeOf<"money.RateSource">();
    expectTypeOf<RateSource["rate"]>().returns.toEqualTypeOf<Promise<RateSnapshot>>();
  });
});
