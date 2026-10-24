/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./electron` entry of @stackra/filesystem (the Electron main-process disk) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Main process only: it loads `electron`. The class is also
 *           exported as `ElectronFileSystem`, the name the template's generated desktop wiring imports, until STA-344
 *           aligns that sample with the `<Name>Driver` class name.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./electron` runtime-target entry); the
 *                     STA-347 stand-in barrel decision.
 */
export {
  ElectronFileSystemDriver,
  ElectronFileSystemDriver as ElectronFileSystem,
} from "#electron/drivers/electron-file-system.driver";
