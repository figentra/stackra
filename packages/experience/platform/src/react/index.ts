/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/platform (`usePlatform`, `useCapability`, `useAppIcon`,
 *          `useLaunchedFiles`, `usePushPermission`, `ScannerView`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Platform-neutral: it imports no DOM-only or React Native
 *           module, so web and native apps share it; the driver supplies what differs.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { AppIconState } from "#react/app-icon/app-icon-state.type";
export { useAppIcon } from "#react/app-icon/use-app-icon";
export { useCapability } from "#react/capability/use-capability";
export { useLaunchedFiles } from "#react/launched-files/use-launched-files";
export { usePlatform } from "#react/platform/use-platform";
export type { PushPermission } from "#react/push-permission/push-permission.type";
export { usePushPermission } from "#react/push-permission/use-push-permission";
export { ScannerView } from "#react/scanner-view/scanner-view";
