/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/platform: the `Bridge` kind base, the folder-picker,
 *          kiosk and second-screen bridges main binds, the main-process kiosk and second-screen drivers, and the
 *          renderer's `ElectronPlatformDriver`, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable in the renderer: no module here imports Electron at
 *           load time (the bridge loads it when it runs).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./desktop` entry); registry A13; the
 *                     STA-347 stand-in barrel decision.
 */
export { Bridge, BridgeBase } from "#desktop/bases/bridge.base";
export { PickFolderBridge } from "#desktop/bridges/pick-folder.bridge";
export { SetKioskModeBridge } from "#desktop/bridges/set-kiosk-mode.bridge";
export { ShowSecondScreenBridge } from "#desktop/bridges/show-second-screen.bridge";
export { ElectronKioskModeDriver } from "#desktop/drivers/electron-kiosk-mode.driver";
export { ElectronPlatformDriver } from "#desktop/drivers/electron-platform.driver";
export { ElectronSecondScreenDriver } from "#desktop/drivers/electron-second-screen.driver";
export type { BridgeOptions } from "#desktop/types/bridge-options.type";
export type { PickFolderInput } from "#desktop/types/pick-folder-input.type";
export type { PickFolderOutput } from "#desktop/types/pick-folder-output.type";
export type { SetKioskModeInput } from "#desktop/types/set-kiosk-mode-input.type";
export type { ShowSecondScreenInput } from "#desktop/types/show-second-screen-input.type";
