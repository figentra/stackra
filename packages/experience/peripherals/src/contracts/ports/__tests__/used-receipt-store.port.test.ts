/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `UsedReceiptStore` port: a port base keyed `peripherals.UsedReceiptStore` whose
 *          drivers are instances of it, with its claim and release signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 16); ADR 0449 (decision 4).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { UsedReceiptStore } from "#contracts/ports/used-receipt-store.port";
import { MemoryUsedReceiptStoreDriver } from "#core/drivers/memory-used-receipt-store.driver";

describe("UsedReceiptStore", () => {
  it("is a port its drivers are instances of", () => {
    const store = new MemoryUsedReceiptStoreDriver();
    expect(store).toBeInstanceOf(UsedReceiptStore);
    expect(store).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.UsedReceiptStore and types its calls", () => {
    expectTypeOf<UsedReceiptStore["~key"]>().toEqualTypeOf<"peripherals.UsedReceiptStore">();
    expectTypeOf<UsedReceiptStore["claim"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<boolean>>
    >();
    expectTypeOf<UsedReceiptStore["release"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
