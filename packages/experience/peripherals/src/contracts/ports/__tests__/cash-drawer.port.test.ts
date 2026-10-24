/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `CashDrawer` port: a port base keyed `peripherals.CashDrawer` whose drivers are
 *          instances of it, with its probe and open signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CashDrawer } from "#contracts/ports/cash-drawer.port";
import { MemoryCashDrawerDriver } from "#core/drivers/memory-cash-drawer.driver";

describe("CashDrawer", () => {
  it("is a port its drivers are instances of", () => {
    const drawer = new MemoryCashDrawerDriver();
    expect(drawer).toBeInstanceOf(CashDrawer);
    expect(drawer).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.CashDrawer and types its calls", () => {
    expectTypeOf<CashDrawer["~key"]>().toEqualTypeOf<"peripherals.CashDrawer">();
    expectTypeOf<CashDrawer["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<CashDrawer["open"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
