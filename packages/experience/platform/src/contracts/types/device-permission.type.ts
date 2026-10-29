/**
 * Stackra file contract:
 * Purpose: `DevicePermission`, the device permissions `SystemPermissions` asks for: camera, location, photos,
 *          Bluetooth and microphone.
 * Boundary: a type only; each value is also the key segment of its explanation, `platform::permissions.<value>.why`.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 2, 2026-10-29 note).
 */

/** A device permission a feature asks for before it uses the hardware. */
export type DevicePermission = "camera" | "location" | "photos" | "bluetooth" | "microphone";
