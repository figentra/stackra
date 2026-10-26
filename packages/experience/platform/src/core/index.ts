/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/platform (the capability codes and the config vocabulary, the
 *          desktop, PWA and push configurations with their shipped schemas, and the memory drivers) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `Platform` is exported from `./contracts` only (registry A3,
 *           ADR 0294 decision 15). The option shapes, the share inbox and the refusal builder stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DesktopConfig } from "#config/desktop.config";
export { KioskConfig } from "#config/kiosk.config";
export { PushConfig } from "#config/push.config";
export { PwaConfig } from "#config/pwa.config";
export { DESKTOP_CONFIG_SCHEMA as DesktopConfig$ } from "#core/constants/desktop-config-schema.constant";
export { KIOSK_CONFIG_SCHEMA as KioskConfig$ } from "#core/constants/kiosk-config-schema.constant";
export { PUSH_CONFIG_SCHEMA as PushConfig$ } from "#core/constants/push-config-schema.constant";
export { PWA_CONFIG_SCHEMA as PwaConfig$ } from "#core/constants/pwa-config-schema.constant";
export { MemoryCaptchaVerifierDriver } from "#core/drivers/memory-captcha-verifier.driver";
export { MemoryKioskModeDriver } from "#core/drivers/memory-kiosk-mode.driver";
export { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
export { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";
export { MemorySecondScreenDriver } from "#core/drivers/memory-second-screen.driver";
export { CachePreset } from "#core/enums/cache-preset.enum";
export { CacheStrategy } from "#core/enums/cache-strategy.enum";
export { Capability } from "#core/enums/capability.enum";
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
export { enterKioskOnLaunch } from "#core/functions/enter-kiosk-on-launch.function";
export type { MemoryPlatformOptions } from "#core/types/memory-platform-options.type";
