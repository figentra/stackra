/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./native` entry of @stackra/platform (`ExpoPlatformDriver`,
 *          `ExpoPushTransportDriver`, `SelfHostedPushTransportDriver`, `ExpoSystemSettingsDriver`, and
 *          `createNotificationChannels` for the push context), what gen lists as candidates for the Expo target,
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loaded on a device only; the permission helpers stay internal.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (entries); the STA-347 stand-in barrel
 *                     decision.
 */
export { ExpoPlatformDriver } from "#native/drivers/expo-platform.driver";
export { ExpoPushTransportDriver } from "#native/drivers/expo-push-transport.driver";
export { SelfHostedPushTransportDriver } from "#native/drivers/self-hosted-push-transport.driver";
export { ExpoSystemSettingsDriver } from "#native/drivers/expo-system-settings.driver";
export { createNotificationChannels } from "#native/functions/create-notification-channels.function";
export type { ExpoSystemModules } from "#native/types/expo-system-modules.type";
