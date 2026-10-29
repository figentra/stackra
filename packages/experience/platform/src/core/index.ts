/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/platform (the capability codes and the config vocabulary, the
 *          app lock, desktop, PWA and push configurations with their shipped schemas, and the memory drivers) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `Platform` is exported from `./contracts` only (registry A3,
 *           ADR 0294 decision 15). The option shapes, the share inbox and the refusal builder stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AppIconConfig } from "#config/app-icon.config";
export { AppLockConfig } from "#config/app-lock.config";
export { DesktopConfig } from "#config/desktop.config";
export { KioskConfig } from "#config/kiosk.config";
export { LiveActivityConfig } from "#config/live-activity.config";
export { PushConfig } from "#config/push.config";
export { PwaConfig } from "#config/pwa.config";
export { APP_ICON_CONFIG_SCHEMA as AppIconConfig$ } from "#core/constants/app-icon-config-schema.constant";
export { APP_LOCK_CONFIG_SCHEMA as AppLockConfig$ } from "#core/constants/app-lock-config-schema.constant";
export { DESKTOP_CONFIG_SCHEMA as DesktopConfig$ } from "#core/constants/desktop-config-schema.constant";
export { KIOSK_CONFIG_SCHEMA as KioskConfig$ } from "#core/constants/kiosk-config-schema.constant";
export { LIVE_ACTIVITY_CONFIG_SCHEMA as LiveActivityConfig$ } from "#core/constants/live-activity-config-schema.constant";
export { PUSH_CONFIG_SCHEMA as PushConfig$ } from "#core/constants/push-config-schema.constant";
export { PWA_CONFIG_SCHEMA as PwaConfig$ } from "#core/constants/pwa-config-schema.constant";
export { MemoryAppIconDriver } from "#core/drivers/memory-app-icon.driver";
export { MemoryAppLockDriver } from "#core/drivers/memory-app-lock.driver";
export { MemoryAppShortcutsDriver } from "#core/drivers/memory-app-shortcuts.driver";
export { MemoryCaptchaVerifierDriver } from "#core/drivers/memory-captcha-verifier.driver";
export { MemoryDevicePermissionsDriver } from "#core/drivers/memory-device-permissions.driver";
export { MemoryHomeWidgetsDriver } from "#core/drivers/memory-home-widgets.driver";
export { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";
export { MemoryLiveActivitiesDriver } from "#core/drivers/memory-live-activities.driver";
export { MemoryLiveActivityPushesDriver } from "#core/drivers/memory-live-activity-pushes.driver";
export { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
export { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";
export { MemorySecondScreenDriver } from "#core/drivers/memory-second-screen.driver";
export { MemorySystemSettingsDriver } from "#core/drivers/memory-system-settings.driver";
export { CachePreset } from "#core/enums/cache-preset.enum";
export { CacheStrategy } from "#core/enums/cache-strategy.enum";
export { PlatformCapability } from "#core/enums/platform-capability.enum";
export { DesktopMode } from "#core/enums/desktop-mode.enum";
export { FileLaunchType } from "#core/enums/file-launch-type.enum";
export { InstallMoment } from "#core/enums/install-moment.enum";
export { InstallPrompt } from "#core/enums/install-prompt.enum";
export { NotificationImportance } from "#core/enums/notification-importance.enum";
export { OverlayAnchor } from "#core/enums/overlay-anchor.enum";
export { OverlayStyle } from "#core/enums/overlay-style.enum";
export { PromptMoment } from "#core/enums/prompt-moment.enum";
export { TrayClickAction } from "#core/enums/tray-click-action.enum";
export { UpdateStrategy } from "#core/enums/update-strategy.enum";
export { WindowKind } from "#core/enums/window-kind.enum";
export { appLockPolicy } from "#core/functions/app-lock-policy.function";
export { enterKioskOnLaunch } from "#core/functions/enter-kiosk-on-launch.function";
export type { AppLockPolicy } from "#core/types/app-lock-policy.type";
export type { MemoryPlatformOptions } from "#core/types/memory-platform-options.type";
