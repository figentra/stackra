/**
 * Stackra file contract:
 * Purpose: `MemoryBarcodeScannerDriver`, the `BarcodeScanner` driver a test scans with: the `memory` candidate
 *          (`peripherals.scanner: "memory"`); `emit(code)` delivers a code to every listener as a scanner would.
 * Boundary: no device is touched. A test sets `isPresent = false` to see the probe refuse; listeners still subscribe,
 *           as they do on a real target before the scanner is plugged in. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decision 4); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { BarcodeScanner } from "#contracts/ports/barcode-scanner.port";
import { refuse } from "#core/functions/refuse.function";

/**
 * A barcode scanner in memory.
 *
 * @example
 * const scanner = new MemoryBarcodeScannerDriver();
 * scanner.onScan((code) => cart.addByBarcode(code));
 * scanner.emit("6281000000012");
 */
export class MemoryBarcodeScannerDriver extends Driver(BarcodeScanner) {
  /** Whether the scanner answers a probe. */
  isPresent = true;

  /** The subscribed listeners. */
  private readonly listeners = new Set<(code: string) => void>();

  /** Answers while present. */
  async probe(): Promise<CapabilityResult> {
    if (!this.isPresent) return refuse(PlatformCapability.Scanner, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Subscribes `listener`; the returned function unsubscribes it. */
  onScan(listener: (code: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Delivers `code` to every listener, as a scan. */
  emit(code: string): void {
    for (const listener of this.listeners) listener(code);
  }
}
