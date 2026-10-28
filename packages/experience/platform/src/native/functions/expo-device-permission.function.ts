/**
 * Stackra file contract:
 * Purpose: `expoDevicePermission`, an Expo permission response as `DevicePermissions` spells it: granted stays
 *          `granted`, `undetermined` reads `prompt`, a refusal the OS will not ask about again reads `blocked`,
 *          anything else is `denied`.
 * Boundary: internal to `./native`; pure.
 * Runtime: react-native
 * Governing contract: ADR 0250 (2026-10-29 note); ADR 0231 (tool-owned values keep their spelling).
 */
import type { DevicePermissionStatus } from "#contracts/types/device-permission-status.type";
import type { ExpoPermissionResponse } from "#native/types/expo-permission-response.type";

/**
 * The port's device permission for an Expo permission response.
 *
 * @example
 * const camera = expoDevicePermission(await Camera.getCameraPermissionsAsync());
 */
export function expoDevicePermission(response: ExpoPermissionResponse): DevicePermissionStatus {
  if (response.granted) return "granted";
  if (response.status === "undetermined") return "prompt";
  return response.canAskAgain ? "denied" : "blocked";
}
