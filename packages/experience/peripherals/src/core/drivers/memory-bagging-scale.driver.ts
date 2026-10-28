/**
 * Stackra file contract:
 * Purpose: `MemoryBaggingScaleDriver`, the `BaggingScale` driver that weighs what a test puts on the bagging area of
 *          a self-checkout lane: the only candidate this package ships for the port, so a lane's bag checks are
 *          testable before a vendor driver exists.
 * Boundary: no device is touched. `gross` is what lies on the scale; setting it streams the net weight (gross less
 *           the zero point) to every `onWeight` listener. `null` means no bagging scale, so every call refuses with
 *           capability `serial` and nothing is streamed. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers);
 *                     STA-965.
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { BaggingScale } from "#contracts/ports/bagging-scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A bagging scale in memory.
 *
 * @example
 * const scale = new MemoryBaggingScaleDriver();
 * scale.gross = { grams: 40, isStable: true };
 * await scale.zero();
 * scale.gross = { grams: 1290, isStable: true };
 * await scale.read(); // { ok: true, data: { grams: 1250, isStable: true } }
 */
export class MemoryBaggingScaleDriver extends Driver(BaggingScale) {
  /** What lies on the scale; null when there is no bagging scale. */
  private current: ScaleReading | null = { grams: 0, isStable: true };

  /** The gross weight that reads as zero. */
  private zeroGrams = 0;

  /** The weight listeners. */
  private readonly listeners = new Set<(reading: ScaleReading) => void>();

  /** What lies on the scale (gross); null when there is no bagging scale. */
  get gross(): ScaleReading | null {
    return this.current;
  }

  /** Puts a weight on the scale (its net streamed to every listener) or, with null, takes the scale away. */
  set gross(next: ScaleReading | null) {
    this.current = next;
    if (next !== null) for (const listener of this.listeners) listener(this.net(next));
  }

  /** Answers while a scale is set. */
  async probe(): Promise<CapabilityResult> {
    if (this.current === null) return refuse(PlatformCapability.Serial, "unavailable");
    return { ok: true, data: undefined };
  }

  /** The net weight now. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    if (this.current === null) return refuse(PlatformCapability.Serial, "unavailable");
    return { ok: true, data: this.net(this.current) };
  }

  /** Makes what lies on the scale now read as zero. */
  async zero(): Promise<CapabilityResult> {
    if (this.current === null) return refuse(PlatformCapability.Serial, "unavailable");
    this.zeroGrams = this.current.grams;
    return { ok: true, data: undefined };
  }

  /** Streams each net weight set from now on. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** `reading` less the zero point. */
  private net(reading: ScaleReading): ScaleReading {
    return { grams: reading.grams - this.zeroGrams, isStable: reading.isStable };
  }
}
