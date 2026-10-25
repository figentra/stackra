/**
 * Stackra file contract:
 * Purpose: the `Scale` port: a weighing scale at the till (ADR 0253). It reads the weight on the scale now and answers
 *          a probe, each as a `CapabilityResult` that refuses with capability `serial` when no scale answers.
 * Boundary: an abstract class that is its own token, keyed `peripherals.Scale`. Only the `memory` driver ships: a scale
 *           speaks over a serial line, which Electron's main process reaches only through a native module (ADR 0253
 *           decision 3: on evidence) and a Chromium renderer through WebSerial, a driver for a later entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16).
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
 */
export abstract class Scale extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.Scale";

  /** Whether a scale answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** The weight on the scale now. */
  abstract read(): Promise<CapabilityResult<ScaleReading>>;
}
