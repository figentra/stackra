/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./electron` entry of @stackra/platform: the `Bridge` kind base, the folder-picker
 *          bridge main binds and the renderer's `ElectronPlatformDriver`, until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Loadable in the renderer: no module here imports Electron at
 *           load time (the bridge loads it when it runs).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./electron` entry); registry A13; the
 *                     STA-347 stand-in barrel decision.
 */
export { Bridge, BridgeBase } from "#electron/bases/bridge.base";
export { PickFolderBridge } from "#electron/bridges/pick-folder.bridge";
export { ElectronPlatformDriver } from "#electron/drivers/electron-platform.driver";
export type { BridgeOptions } from "#electron/types/bridge-options.type";
export type { PickFolderInput } from "#electron/types/pick-folder-input.type";
export type { PickFolderOutput } from "#electron/types/pick-folder-output.type";
