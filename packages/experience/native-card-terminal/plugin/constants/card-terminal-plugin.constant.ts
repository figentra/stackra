/**
 * Stackra file contract:
 * Purpose: `CARD_TERMINAL_PLUGIN`, the fixed entries the config plugin writes: the English default usage strings, the
 *          iOS background mode and Tap to Pay entitlement, and the Android permissions (with the SDK levels the legacy
 *          Bluetooth ones stop at) and the NFC feature, from Stripe Terminal's public SDK requirements.
 * Boundary: internal data. The usage strings are defaults an app overrides through the plugin's options.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6).
 */

/** The plugin's entries. */
export const CARD_TERMINAL_PLUGIN = Object.freeze({
  bluetoothUsage: "This app uses Bluetooth to connect to card readers.",
  locationUsage: "This app uses your location to confirm where card payments are taken.",
  backgroundMode: "bluetooth-central",
  tapToPayEntitlement: "com.apple.developer.proximity-reader.payment.acceptance",
  /** Each Android permission, with the last SDK level it applies to where it is a legacy one. */
  androidPermissions: Object.freeze([
    { name: "android.permission.BLUETOOTH", maxSdkVersion: "30" },
    { name: "android.permission.BLUETOOTH_ADMIN", maxSdkVersion: "30" },
    { name: "android.permission.BLUETOOTH_SCAN" },
    { name: "android.permission.BLUETOOTH_CONNECT" },
    { name: "android.permission.ACCESS_COARSE_LOCATION" },
    { name: "android.permission.ACCESS_FINE_LOCATION" },
    { name: "android.permission.NFC" },
  ] as const),
  /** Hardware the app uses but does not require, so the store does not hide it from phones without it. */
  androidFeatures: Object.freeze([
    "android.hardware.nfc",
    "android.hardware.bluetooth_le",
  ] as const),
} as const);
