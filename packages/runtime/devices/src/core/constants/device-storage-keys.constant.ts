/**
 * Stackra file contract:
 * Purpose: `DEVICE_STORAGE_KEYS`, where a device app keeps its identity: the install id in the `prefs` area and the
 *          credential the hub handed it at pairing in the `secrets` area of `@stackra/storage`.
 * Boundary: data only; the one spelling the stored drivers and the pairing driver share.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (storage areas: `secrets` only where the platform protects them); ADR 0361 (decision
 *                     7); ADR 0338 (decision 1).
 */

/** The storage keys of a device's identity. */
export const DEVICE_STORAGE_KEYS = Object.freeze({
  /** `prefs`: the install id, minted once. */
  deviceId: "devices.device_id",
  /** `secrets`: the access token from pairing. */
  token: "devices.device_token",
});
