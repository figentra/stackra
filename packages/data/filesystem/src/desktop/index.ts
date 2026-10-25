/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/filesystem (the Electron main-process disk) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Main process only: it loads `electron`. One name per symbol:
 *           the class is `ElectronFileSystemDriver`, and the template's generated desktop wiring imports that name.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0345 (decision 9); ADR 0127 2026-10-24 note (`./desktop`
 *                     runtime-target entry); the STA-347 stand-in barrel decision.
 */
export { ElectronFileSystemDriver } from "#desktop/drivers/electron-file-system.driver";
