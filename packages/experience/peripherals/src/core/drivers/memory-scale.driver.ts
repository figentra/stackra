/**
 * Stackra file contract:
 * Purpose: `MemoryScaleDriver`, the `Scale` driver that weighs what a test puts on it: the only candidate this package
 *          ships for the port, so a till's weighed items are testable before a scale driver exists.
 * Boundary: no device is touched. `reading` is what the next read answers; `null` means no scale, so the probe and the
 *           read refuse with capability `serial`. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers).
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { Scale } from "#contracts/ports/scale.port";
import type { ScaleReading } from "#contracts/types/scale-reading.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * A scale in memory.
 *
 * @example
 * const scale = new MemoryScaleDriver();
 * scale.reading = { grams: 1250, isStable: true };
 * await scale.read(); // { ok: true, data: { grams: 1250, isStable: true } }
 */
export class MemoryScaleDriver extends Driver(Scale) {
  /** What the scale reads now; null when there is no scale. */
  reading: ScaleReading | null = { grams: 0, isStable: true };

  /** Answers while a scale is set. */
  async probe(): Promise<CapabilityResult> {
    if (this.reading === null) return refuse(Capability.Serial, "unavailable");
    return { ok: true, data: undefined };
  }

  /** The reading set now. */
  async read(): Promise<CapabilityResult<ScaleReading>> {
    if (this.reading === null) return refuse(Capability.Serial, "unavailable");
    return { ok: true, data: this.reading };
  }
}
