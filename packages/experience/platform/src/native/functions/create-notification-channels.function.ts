/**
 * Stackra file contract:
 * Purpose: `createNotificationChannels`, which creates or updates the Android notification channels
 *          `PushConfig.androidChannels` lists through expo-notifications, each named in the phone's language, so the
 *          person mutes or changes each one in the system settings (one channel per notification category).
 * Boundary: exported from `./native`; the push context calls it at launch before the first permission prompt (Android
 *           13 shows the prompt only once a channel exists) and again when the phone's language changes, since
 *           creating an existing channel only renames it. The OS keeps the person's own changes to a channel
 *           (importance, sound); a no-op off Android.
 * Runtime: react-native
 * Governing contract: ADR 0255 (decision 3, 2026-10-29 note); ADR 0223 (category drives channel).
 */
import * as Notifications from "expo-notifications";

import type { PushConfig } from "#config/push.config";
import type { NotificationImportance } from "#core/enums/notification-importance.enum";

/** expo-notifications' importance of each configured importance. */
const IMPORTANCE: Readonly<Record<NotificationImportance, Notifications.AndroidImportance>> = {
  min: Notifications.AndroidImportance.MIN,
  low: Notifications.AndroidImportance.LOW,
  default: Notifications.AndroidImportance.DEFAULT,
  high: Notifications.AndroidImportance.HIGH,
  max: Notifications.AndroidImportance.MAX,
};

/**
 * Creates or renames the configured Android channels.
 *
 * @example
 * await createNotificationChannels(pushConfig.androidChannels, (key) => i18n.t(key));
 */
export async function createNotificationChannels(
  channels: PushConfig["androidChannels"],
  translate: (key: string) => string,
): Promise<void> {
  for (const channel of channels)
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: translate(channel.nameKey),
      importance: IMPORTANCE[channel.importance],
      enableVibrate: channel.vibrate,
      sound: channel.sound,
    });
}
