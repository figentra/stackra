/**
 * Stackra file contract:
 * Purpose: `browserPermission`, the browser's notification permission as the port spells it: `default` (not asked)
 *          reads `prompt`, and a browser without the Notifications API reads `denied`.
 * Boundary: internal; not exported from the entry. Reads only.
 * Runtime: browser
 * Governing contract: ADR 0250 (decision 2); ADR 0255 (decision 3).
 */
import type { PermissionStatus } from "#contracts/types/permission-status.type";

/**
 * Where the notification permission stands.
 *
 * @example
 * if (browserPermission() === "prompt") await Notification.requestPermission();
 */
export function browserPermission(
  status: NotificationPermission | undefined = globalThis.Notification?.permission,
): PermissionStatus {
  if (status === undefined) return "denied";
  return status === "default" ? "prompt" : status;
}
