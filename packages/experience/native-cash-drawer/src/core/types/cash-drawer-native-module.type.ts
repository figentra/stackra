/**
 * Stackra file contract:
 * Purpose: `CashDrawerNativeModule`, the `StackraCashDrawer` Expo module this package ships (`android/`, and an `ios/`
 *          half that links no family): the status of the printer that drives a terminal's drawer port and the drawer
 *          pulse, each a thin pass-through to the named vendor's SDK.
 * Boundary: a type only. The module maps nothing: the status is the SDK's own number, read by the TypeScript driver
 *           through the vendor's `printerReady` codes, and a vendor the build does not link rejects. A pulse is one-way.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2, 4 and 5); ADR 0458 (decisions 2 and 3); ADR 0459 (decisions 2 and 3).
 */

/** The package's Expo module. */
export interface CashDrawerNativeModule {
  /** The status of the printer that drives the drawer, exactly as the vendor SDK returns it. */
  status: (vendor: string) => Promise<number>;
  /** Pulses the terminal's drawer port. */
  open: (vendor: string) => Promise<void>;
}
