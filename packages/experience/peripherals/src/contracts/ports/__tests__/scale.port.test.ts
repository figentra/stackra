/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `Scale` port: a port base keyed `peripherals.Scale` whose drivers are instances
 *          of it, with its probe and read signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Scale } from "#contracts/ports/scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { MemoryScaleDriver } from "#core/drivers/memory-scale.driver";

describe("Scale", () => {
  it("is a port its drivers are instances of", () => {
    const scale = new MemoryScaleDriver();
    expect(scale).toBeInstanceOf(Scale);
    expect(scale).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.Scale and types its calls", () => {
    expectTypeOf<Scale["~key"]>().toEqualTypeOf<"peripherals.Scale">();
    expectTypeOf<Scale["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<Scale["read"]>().returns.toEqualTypeOf<Promise<CapabilityResult<ScaleReading>>>();
  });
});
