/**
 * Stackra file contract:
 * Purpose: `ReceiptPrinterNativeModule`, the `StackraReceiptPrinter` Expo module this package ships (`ios/`,
 *          `android/`): the printer's raw status, text printing and the drawer pulse, each a thin pass-through to the
 *          named vendor's SDK.
 * Boundary: a type only. The module maps nothing: the status is the SDK's own number, read by the TypeScript driver
 *           through the vendor's `printerReady` codes, and a vendor the build does not link rejects. Lines cross as
 *           text, never printer commands; `target` is the vendor SDK's own target string (empty for a built-in
 *           printer).
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0458 (decision 2); ADR 0459 (decision 2).
 */

/** The package's Expo module. */
export interface ReceiptPrinterNativeModule {
  /** The printer's status, exactly as the vendor SDK returns it; rejects when the printer cannot be reached. */
  status: (vendor: string, target: string) => Promise<number>;
  /** Prints the lines as text in the SDK's default font, feeds, and cuts where the model has a cutter. */
  printLines: (vendor: string, target: string, lines: readonly string[]) => Promise<void>;
  /** Pulses the drawer wired to the printer on `pin` (2 or 5); a built-in drawer port ignores the pin. */
  kickDrawer: (vendor: string, target: string, pin: number) => Promise<void>;
}
