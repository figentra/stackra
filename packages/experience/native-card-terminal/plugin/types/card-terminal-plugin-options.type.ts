/**
 * Stackra file contract:
 * Purpose: `CardTerminalPluginOptions`, what an app passes to the `@stackra/native-card-terminal` config plugin: the
 *          iOS usage strings and whether Tap to Pay is on for this app.
 * Boundary: a type only. Every field is optional: the usage strings default to English (the app's locale overlays
 *           translate them), and Tap to Pay is off until the app's runway turns it on (the launch-gate row of ADR 0446
 *           decision 5).
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6); ADR 0478 (decision 2).
 */

/** The plugin's options. */
export interface CardTerminalPluginOptions {
  /** `NSBluetoothAlwaysUsageDescription`, shown when iOS asks for Bluetooth. */
  readonly bluetoothUsage?: string;

  /** `NSLocationWhenInUseUsageDescription`, shown when iOS asks for the location. */
  readonly locationUsage?: string;

  /** Adds the iOS Tap to Pay entitlement; the Android NFC permission is always declared, as not required. */
  readonly isTapToPayEnabled?: boolean;
}
