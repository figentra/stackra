/**
 * Stackra file contract:
 * Purpose: `CustomerDisplayNativeModule`, the native module the `external` customer display driver calls: the app's
 *          `StackraCustomerDisplay` Expo module, an Android `Presentation` on the connected display or an iPad
 *          external-display scene, each drawing the view natively.
 * Boundary: a type only. The Kotlin and Swift sources live in the mobile app's `src/native-sources/customer-display/`
 *           (ADR 0345 decision 6); the view crosses as JSON.
 * Runtime: isomorphic
 * Governing contract: ADR 0430 (decision 1); ADR 0339 (open question 3); ADR 0345 (decision 6).
 */

/** The `StackraCustomerDisplay` native module. */
export interface CustomerDisplayNativeModule {
  /** Whether an external display is connected now. */
  isAvailable(): Promise<boolean>;
  /** Draws the view (a `CustomerDisplayView` as JSON) on the external display, opening it when closed. */
  show(view: string): Promise<void>;
  /** Shows the idle screen on the external display. */
  clear(): Promise<void>;
}
