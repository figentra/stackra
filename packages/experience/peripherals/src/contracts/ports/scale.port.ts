/**
 * Stackra file contract:
 * Purpose: the `Scale` port: a stand-alone weighing scale at a till or a counter (ADR 0253). It reads the weight on
 *          the scale now, streams every weight change to a listener, and answers a probe, each read as a
 *          `CapabilityResult` that refuses with capability `serial` when no scale answers. A scanner-scale is the
 *          `ScannerScale` port and a self-checkout's bagging area the `BaggingScale` port (STA-965), so one device
 *          binds them side by side.
 * Boundary: an abstract class that is its own token, keyed `peripherals.Scale`. Only the `memory` driver ships: a scale
 *           speaks over a serial line, which Electron's main process reaches only through a native module (ADR 0253
 *           decision 3: on evidence) and a Chromium renderer through WebSerial, a driver for a later entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { ScaleReading } from "#contracts/types/scale-reading.type";

/**
 * The weighing scale.
 *
 * @example
 * const weight = await scale.read();
 * if (weight.ok && weight.data.isStable) line.setGrams(weight.data.grams);
 * const stop = scale.onWeight((reading) => lane.checkBag(reading));
 */
export abstract class Scale extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.Scale";

  /** Whether a scale answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** The weight on the scale now. */
  abstract read(): Promise<CapabilityResult<ScaleReading>>;

  /** Calls `listener` with each new weight, settled or not, until the returned function stops it. */
  abstract onWeight(listener: (reading: ScaleReading) => void): () => void;
}
