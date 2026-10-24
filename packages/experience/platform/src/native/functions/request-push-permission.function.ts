/**
 * Stackra file contract:
 * Purpose: `requestPushPermission`, which shows the OS push prompt through expo-notifications with the app's iOS
 *          choice (`PushConfig.iosProvisional`: ask for quiet provisional authorization first) and answers where the
 *          permission stands afterwards.
 * Boundary: internal to `./native`. A permission already decided is answered without a prompt; the OS shows its
 *           prompt once, so a denied permission stays denied until the user changes it in settings.
 * Runtime: react-native
 * Governing contract: ADR 0255 (decision 3); ADR 0250 (decision 2).
 */
import * as Notifications from "expo-notifications";

import type { PushConfig } from "#config/push.config";
import type { PermissionStatus } from "#contracts/types/permission-status.type";
import { readPushPermission } from "#native/functions/read-push-permission.function";

/**
 * Asks for the push permission when it is not decided.
 *
 * @example
 * const status = await requestPushPermission(config); // "granted" | "denied" | "prompt"
 */
export async function requestPushPermission(config: PushConfig): Promise<PermissionStatus> {
  const current = await readPushPermission();
  if (current !== "prompt") return current;
  await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowProvisional: config.iosProvisional,
    },
  });
  return readPushPermission();
}
