/**
 * Stackra file contract:
 * Purpose: `MemoryScaleDriver`, the `Scale` driver that weighs what a test puts on it: the only candidate this package
 *          ships for the port, so a till's weighed items and a lane's bag check are testable before a scale driver
 *          exists.
 * Boundary: no device is touched. `reading` is what the next read answers, and setting it to a weight streams that
 *           weight to every `onWeight` listener; `null` means no scale, so the probe and the read refuse with capability
 *           `serial` and nothing is streamed. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { PlatformCapability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { Scale } from "#contracts/ports/scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A scale in memory.
 *
 * @example
 * const scale = new MemoryScaleDriver();
 * const stop = scale.onWeight((reading) => seen.push(reading));
 * scale.reading = { grams: 1250, isStable: true };
 * await scale.read(); // { ok: true, data: { grams: 1250, isStable: true } }
 */
export class MemoryScaleDriver extends Driver(Scale) {
  /** What the scale reads now; null when there is no scale. */
  private current: ScaleReading | null = { grams: 0, isStable: true };

  /** The weight listeners. */
  private readonly listeners = new Set<(reading: ScaleReading) => void>();

  /** What the scale reads now; null when there is no scale. */
  get reading(): ScaleReading | null {
    return this.current;
  }

  /** Puts a weight on the scale (streamed to every listener) or, with null, takes the scale away. */
  set reading(next: ScaleReading | null) {
    this.current = next;
    if (next !== null) for (const listener of this.listeners) listener(next);
  }

  /** Answers while a scale is set. */
  async probe(): Promise<CapabilityResult> {
    if (this.reading === null) return refuse(PlatformCapability.Serial, "unavailable");
    return { ok: true, data: undefined };
  }

  /** The reading set now. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    if (this.reading === null) return refuse(PlatformCapability.Serial, "unavailable");
    return { ok: true, data: this.reading };
  }

  /** Streams each weight set from now on. */
  onWeight(listener: (reading: ScaleReading) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
