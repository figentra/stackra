/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `BarcodeScanner` port: a port base keyed `peripherals.BarcodeScanner` whose
 *          drivers are instances of it, with its probe and subscription signatures.
 * Boundary: test only; the driver is the package's memory driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import { MemoryBarcodeScannerDriver } from "#core/drivers/memory-barcode-scanner.driver";

describe("BarcodeScanner", () => {
  it("is a port its drivers are instances of", () => {
    const scanner = new MemoryBarcodeScannerDriver();
    expect(scanner).toBeInstanceOf(BarcodeScanner);
    expect(scanner).toBeInstanceOf(Port);
  });

  it("is keyed peripherals.BarcodeScanner and types its calls", () => {
    expectTypeOf<BarcodeScanner["~key"]>().toEqualTypeOf<"peripherals.BarcodeScanner">();
    expectTypeOf<BarcodeScanner["probe"]>().returns.toEqualTypeOf<Promise<CapabilityResult>>();
    expectTypeOf<BarcodeScanner["onScan"]>().parameter(0).toEqualTypeOf<(code: string) => void>();
    expectTypeOf<BarcodeScanner["onScan"]>().returns.toEqualTypeOf<() => void>();
  });
});
