/**
 * Stackra file contract:
 * Purpose: `STRIPE_TERMINAL`, the fixed facts the Stripe Terminal drivers read: the Expo module's name and token
 *          event, the market pack's provider key, how long Bluetooth discovery runs, and the SDK names (normalised by
 *          `sdkName`) that mean a refused permission, a reader taking a payment, or this phone as the reader.
 * Boundary: internal data, not exported from the entry. The names are the SDK's own enum cases (iOS case names,
 *           Android enum names), transcribed from Stripe's public SDK documents; certification pending (STA-739).
 * Runtime: isomorphic
 * Governing contract: ADR 0479 (decisions 1, 2 and 3); ADR 0253 (decision 4).
 */

/** The Stripe Terminal facts. */
export const STRIPE_TERMINAL = Object.freeze({
  /** The Expo module's name in `globalThis.expo.modules`. */
  module: "StackraCardTerminal",
  /** The event the module sends when the SDK asks for a connection token. */
  tokenEvent: "onConnectionTokenRequest",
  /** The provider key the market pack names for Stripe (`payments.terminal-providers`). */
  provider: "stripe",
  /** How long a Bluetooth discovery runs before it gives up, in milliseconds. */
  discoveryTimeoutMs: 30_000,
  /** What the token relay tells the SDK when the server refused; never the server's own message. */
  tokenFailure: "connection_token_failed",
  /** SDK error codes that mean a refused or disabled Bluetooth or location permission. */
  permissionCodes: Object.freeze([
    "bluetooth_access_denied",
    "bluetooth_permission_denied",
    "location_services_disabled",
    "location_permission_denied",
  ]),
  /** SDK payment statuses of a reader taking a payment. */
  busyStatuses: Object.freeze(["waiting_for_input", "processing"]),
  /** SDK device types of this phone acting as the reader. */
  tapToPayDeviceTypes: Object.freeze(["tap_to_pay", "apple_built_in", "tap_to_pay_device"]),
} as const);
