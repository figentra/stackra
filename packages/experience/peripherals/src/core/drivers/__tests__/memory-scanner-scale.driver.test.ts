/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryScannerScaleDriver`: it is a `ScannerScale`,
 *          reads an empty settled scale by default, reads and streams net weights after `zero`, and refuses
 *          with `unavailable` on `serial` when there is no scale.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0253; STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { ScannerScale } from "#contracts/ports/scanner-scale.port";
import { MemoryScannerScaleDriver } from "#core/drivers/memory-scanner-scale.driver";

describe("MemoryScannerScaleDriver", () => {
  it("reads what is on it, net of the zero point", async () => {
    const scale = new MemoryScannerScaleDriver();
    expect(scale).toBeInstanceOf(ScannerScale);
    expect(await scale.read()).toEqual({ ok: true, data: { grams: 0, isStable: true } });
    scale.gross = { grams: 40, isStable: true };
    expect(await scale.zero()).toEqual({ ok: true, data: undefined });
    scale.gross = { grams: 1290, isStable: false };
    expect(await scale.probe()).toEqual({ ok: true, data: undefined });
    expect(await scale.read()).toEqual({ ok: true, data: { grams: 1250, isStable: false } });
  });

  it("refuses with no scale", async () => {
    const scale = new MemoryScannerScaleDriver();
    scale.gross = null;
    const refused = { ok: false, error: { code: "unavailable", capability: "serial" } };
    expect(await scale.probe()).toEqual(refused);
    expect(await scale.read()).toEqual(refused);
    expect(await scale.zero()).toEqual(refused);
  });

  it("streams each net weight to its listeners until they stop", async () => {
    const scale = new MemoryScannerScaleDriver();
    const seen: unknown[] = [];
    const stop = scale.onWeight((reading) => seen.push(reading));
    scale.gross = { grams: 20, isStable: true };
    await scale.zero();
    scale.gross = { grams: 320, isStable: true };
    scale.gross = null;
    stop();
    scale.gross = { grams: 900, isStable: true };
    expect(seen).toEqual([
      { grams: 20, isStable: true },
      { grams: 300, isStable: true },
    ]);
  });
});
