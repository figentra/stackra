/**
 * Stackra file contract:
 * Purpose: `PosDeviceNativeModule`, the Expo module a POS terminal family's drivers call (`StackraSunmi`,
 *          `StackraPax`, `StackraImin`): the built-in printer's raw status, text printing, the drawer kick and the
 *          built-in scanner's decoded codes, each a thin pass-through to the vendor SDK.
 * Boundary: a type only. The Kotlin sources live in the till app's `src/native-sources/<family>/` (ADR 0345 decision 6)
 *           and do no mapping: the status is the SDK's own number, read by the JS driver through the family's
 *           `printerReady` codes. Lines cross as text, never printer commands.
 * Runtime: isomorphic
 * Governing contract: ADR 0442 (decision 4); ADR 0458, ADR 0459, ADR 0460 (one per vendor SDK); ADR 0345 (decision 6).
 */

/** The family's Expo module. */
export interface PosDeviceNativeModule {
  /** The built-in printer's status, exactly as the vendor SDK returns it; rejects when no printer service is bound. */
  printerStatus: () => Promise<number>;
  /** Prints the lines as text in the SDK's default font, feeds, and cuts where the model has a cutter. */
  printLines: (lines: readonly string[]) => Promise<void>;
  /** Pulses the drawer wired to the terminal's drawer port. */
  openDrawer: () => Promise<void>;
  /** Calls `listener` with each code the built-in scanner decodes; `remove` on the answer stops it. */
  addListener: (
    eventName: "onScan",
    listener: (event: { readonly code?: unknown }) => void,
  ) => { remove: () => void };
}
