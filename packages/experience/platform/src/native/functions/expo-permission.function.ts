/**
 * Stackra file contract:
 * Purpose: `expoPermission`, an Expo permission response as the port spells it: granted stays `granted`,
 *          `undetermined` reads `prompt`, anything else is `denied`.
 * Boundary: internal to `./native`; pure.
 * Runtime: react-native
 * Governing contract: ADR 0250 (decision 2); ADR 0231 (tool-owned values keep their spelling).
 */
import type { PermissionStatus } from "#contracts/types/permission-status.type";

/**
 * The port's permission for an Expo permission response.
 *
 * @example
 * const camera = expoPermission(await Camera.getCameraPermissionsAsync());
 */
export function expoPermission(response: {
  readonly granted: boolean;
  readonly status: string;
}): PermissionStatus {
  if (response.granted) return "granted";
  return response.status === "undetermined" ? "prompt" : "denied";
}
