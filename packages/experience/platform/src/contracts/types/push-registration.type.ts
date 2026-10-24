/**
 * Stackra file contract:
 * Purpose: `PushRegistration`, what a push transport returns once the device can receive pushes: the provider that
 *          issued the address and the address itself, which the devices module stores (ADR 0235).
 * Boundary: a type only. The token is an address, not a secret, but it is per device: never logged.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (devices); ADR 0255 (push per platform).
 */

/** A device's push address. */
export interface PushRegistration {
  /** The transport that issued it (`expo`, `fcm`, `apns`, `web_push`). */
  readonly provider: string;

  /** The address: an Expo push token, a native device token, or a Web Push subscription as JSON. */
  readonly token: string;
}
