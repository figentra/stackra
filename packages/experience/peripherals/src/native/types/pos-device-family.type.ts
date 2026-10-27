/**
 * Stackra file contract:
 * Purpose: `PosDeviceFamily`, one POS terminal family the `./native` drivers serve: its driver name, the Expo module
 *          its app links and the vendor SDK status codes that mean the printer is ready.
 * Boundary: a type only; the three families are `POS_DEVICE_FAMILIES`. Which families a build links is the runway's
 *           `device:<family>` capability (ADR 0442 decision 3), never this type.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decisions 3 and 4); ADR 0458, ADR 0459, ADR 0460.
 */

/** A POS terminal family. */
export interface PosDeviceFamily {
  /** The driver name in `peripherals.printer`, `.drawer` and `.scanner`. */
  readonly name: "sunmi" | "pax" | "imin";
  /** The Expo module name in the app's modules registry. */
  readonly module: string;
  /** The vendor SDK printer status codes that mean ready; any other code refuses. */
  readonly printerReady: readonly number[];
}
