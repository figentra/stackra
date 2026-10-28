/**
 * Stackra file contract:
 * Purpose: `readPushPermission`, the device's notification permission as the port spells it, read through
 *          expo-notifications: `undetermined` reads `prompt`, and iOS provisional (quiet) authorization counts as
 *          granted.
 * Boundary: internal to `./native`; reads only, never prompts.
 * Runtime: react-native
 * Governing contract: ADR 0255 (decision 3); ADR 0250 (decision 2).
 */
import * as Notifications from "expo-notifications";

import type { PermissionStatus } from "#contracts/types/permission-status.type";

/**
 * Where the push permission stands on this device.
 *
 * @example
 * if ((await readPushPermission()) !== "granted") return refuse(PlatformCapability.Push, "permission_denied");
 */
export async function readPushPermission(): Promise<PermissionStatus> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return "granted";
  if (settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return "granted";
  return settings.status === "undetermined" ? "prompt" : "denied";
}
