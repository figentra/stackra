/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `BaggingScale` port: a port base keyed `peripherals.BaggingScale` whose drivers
 *          are instances of it, with its probe, read and zero signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; ADR 0294 (decision 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BaggingScale } from "#contracts/ports/bagging-scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { MemoryBaggingScaleDriver } from "#core/drivers/memory-bagging-scale.driver";

describe("BaggingScale", () => {
  it("is a port its drivers are instances of", () => {
    const scale = new MemoryBaggingScaleDriver();
    expect(scale).toBeInstanceOf(BaggingScale);
    expect(scale).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.BaggingScale and types its calls", () => {
    expectTypeOf<BaggingScale["~key"]>().toEqualTypeOf<"peripherals.BaggingScale">();
    expectTypeOf<BaggingScale["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<BaggingScale["read"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<ScaleReading>>
    >();
    expectTypeOf<BaggingScale["zero"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
