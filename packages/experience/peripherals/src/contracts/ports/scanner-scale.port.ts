/**
 * Stackra file contract:
 * Purpose: the `ScannerScale` port: the scale built into a till's flatbed scanner (a scanner-scale). It reads the
 *          weight on the platter now, streams every weight change to the till (the weighed-item line follows the
 *          platter), zeroes the empty platter, and answers a probe, each as a `CapabilityResult` that refuses with
 *          capability `serial` when no scanner-scale answers.
 * Boundary: an abstract class that is its own token, keyed `peripherals.ScannerScale`; a port of its own, so a
 *           self-checkout binds a scanner-scale and a `BaggingScale` side by side. The scanner half stays the
 *           `BarcodeScanner` port. A typed manual weight (a role and a reason) is the product's rule, not this port's.
 *           Only the `memory` driver ships; a vendor protocol driver needs its own ADR (ADR 0253 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { ScaleReading } from "#contracts/types/scale-reading.type";

/**
 * The till's scanner-scale.
 *
 * @example
 * const stop = scannerScale.onWeight((reading) => line.showWeight(reading));
 * const weight = await scannerScale.read();
 * if (weight.ok && weight.data.isStable) line.setGrams(weight.data.grams);
 */
export abstract class ScannerScale extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.ScannerScale";

  /** Whether a scanner-scale answers now. */
  abstract probe(): Promise<CapabilityResult>;

  /** The net weight on the platter now. */
  abstract read(): Promise<CapabilityResult<ScaleReading>>;

  /** Zeroes the platter: what lies on it now reads as nothing from here on. */
  abstract zero(): Promise<CapabilityResult>;

  /** Calls `listener` with each new weight, settled or not, until the returned function stops it. */
  abstract onWeight(listener: (reading: ScaleReading) => void): () => void;
}
