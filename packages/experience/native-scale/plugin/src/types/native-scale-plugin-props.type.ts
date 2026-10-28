/**
 * Stackra file contract:
 * Purpose: `NativeScalePluginProps`, the options of the native scale config plugin in an app's Expo config:
 *          which transports the app's runway lists (only their permissions and native code are kept) and the
 *          Bluetooth usage text iOS shows.
 * Boundary: a type only; snake_case transport values shared with `ScaleTransport`. Every field is optional: no
 *           options keep all three transports.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2: the plugin removes what the runway does not list); ADR 0442 (decision 3).
 */

/** The plugin's options. */
export interface NativeScalePluginProps {
  /** The transports to keep (`ble`, `spp`, `usb`); the default keeps all three. */
  readonly transports?: readonly ("ble" | "spp" | "usb")[];
  /** The text iOS shows when it asks for Bluetooth. */
  readonly bluetoothUsage?: string;
}
