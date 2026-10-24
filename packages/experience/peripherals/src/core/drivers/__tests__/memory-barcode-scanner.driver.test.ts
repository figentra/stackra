/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryBarcodeScannerDriver`: `emit` reaches every subscribed listener and none that
 *          unsubscribed, and an absent scanner's probe refuses with `unavailable` on `scanner`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryBarcodeScannerDriver } from "#core/drivers/memory-barcode-scanner.driver";

describe("MemoryBarcodeScannerDriver", () => {
  it("delivers each code to the subscribed listeners", () => {
    const scanner = new MemoryBarcodeScannerDriver();
    const first: string[] = [];
    const second: string[] = [];
    const stopFirst = scanner.onScan((code) => first.push(code));
    scanner.onScan((code) => second.push(code));
    scanner.emit("6281000000012");
    stopFirst();
    scanner.emit("4006381333931");
    expect(first).toEqual(["6281000000012"]);
    expect(second).toEqual(["6281000000012", "4006381333931"]);
  });

  it("probes as present until a test says otherwise", async () => {
    const scanner = new MemoryBarcodeScannerDriver();
    expect(await scanner.probe()).toEqual({ ok: true, data: undefined });
    scanner.isPresent = false;
    expect(await scanner.probe()).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "scanner" },
    });
  });
});
