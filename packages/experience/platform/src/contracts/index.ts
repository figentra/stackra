/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/platform, the leaf entry of its ports and the types
 *          their signatures name, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package.
 *           `Platform` is exported from here only, never from `.` (registry A3, ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AppLock } from "#contracts/ports/app-lock.port";
export { CaptchaVerifier } from "#contracts/ports/captcha-verifier.port";
export { DevicePermissions } from "#contracts/ports/device-permissions.port";
export { KioskMode } from "#contracts/ports/kiosk-mode.port";
export { Platform } from "#contracts/ports/platform.port";
export { PlatformPushTransport } from "#contracts/ports/platform-push-transport.port";
export { SecondScreen } from "#contracts/ports/second-screen.port";
export { SystemSettings } from "#contracts/ports/system-settings.port";
export type { BadgeCapability } from "#contracts/types/badge-capability.type";
export type { BarcodeFormat } from "#contracts/types/barcode-format.type";
export type { CapabilityRefusal } from "#contracts/types/capability-refusal.type";
export type { CapabilityResult } from "#contracts/types/capability-result.type";
export type { DevicePermission } from "#contracts/types/device-permission.type";
export type { DevicePermissionStatus } from "#contracts/types/device-permission-status.type";
export type { FileHandlingCapability } from "#contracts/types/file-handling-capability.type";
export type { HapticsCapability } from "#contracts/types/haptics-capability.type";
export type { InstallCapability } from "#contracts/types/install-capability.type";
export type { NetworkCapability } from "#contracts/types/network-capability.type";
export type { NotificationsCapability } from "#contracts/types/notifications-capability.type";
export type { PermissionStatus } from "#contracts/types/permission-status.type";
export type { PushRegistration } from "#contracts/types/push-registration.type";
export type { ReadonlySignal } from "#contracts/types/readonly-signal.type";
export type { ScannerCapability } from "#contracts/types/scanner-capability.type";
export type { ScannerViewProps } from "#contracts/types/scanner-view-props.type";
export type { ShareCapability } from "#contracts/types/share-capability.type";
export type { ShareData } from "#contracts/types/share-data.type";
export type { SharedPayload } from "#contracts/types/shared-payload.type";
export type { ShareTargetCapability } from "#contracts/types/share-target-capability.type";
