/**
 * Stackra file contract:
 * Purpose: `CustomerDisplayNativeModule`, the native module the `external` customer display driver calls: this
 *          package's `StackraCustomerDisplay` Expo module, an Android `Presentation` on the connected display or an
 *          iPad external-display scene, each drawing the view natively.
 * Boundary: a type only, internal to the package. The Swift and Kotlin sources live in this package's `ios/` and
 *           `android/` (ADR 0478 decision 2); the view crosses as JSON.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0478 (decisions 2 and 5).
 */

/** The package's `StackraCustomerDisplay` Expo module. */
export interface CustomerDisplayNativeModule {
  /** Whether an external display is connected now. */
  isAvailable: () => Promise<boolean>;
  /** Draws the view (a `CustomerDisplayView` as JSON) on the external display, opening it when closed. */
  show: (view: string) => Promise<void>;
  /** Shows the idle screen on the external display. */
  clear: () => Promise<void>;
}
