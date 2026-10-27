/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `ScannerScale` port: a port base keyed `peripherals.ScannerScale` whose drivers
 *          are instances of it, with its probe, read and zero signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; ADR 0294 (decision 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { ScannerScale } from "#contracts/ports/scanner-scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { MemoryScannerScaleDriver } from "#core/drivers/memory-scanner-scale.driver";

describe("ScannerScale", () => {
  it("is a port its drivers are instances of", () => {
    const scale = new MemoryScannerScaleDriver();
    expect(scale).toBeInstanceOf(ScannerScale);
    expect(scale).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.ScannerScale and types its calls", () => {
    expectTypeOf<ScannerScale["~key"]>().toEqualTypeOf<"peripherals.ScannerScale">();
    expectTypeOf<ScannerScale["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<ScannerScale["read"]>().returns.toEqualTypeOf<
      Promise<CapabilityResult<ScaleReading>>
    >();
    expectTypeOf<ScannerScale["zero"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
  });
});
