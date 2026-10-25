/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/identity (`ElectronSignInBrowserDriver`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Electron main process only: it imports `electron` (an
 *           optional peer) and `node:http`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0277; ADR 0127 2026-10-24 note (`./desktop` entry); the STA-347
 *                     stand-in barrel decision.
 */
export { ElectronSignInBrowserDriver } from "#desktop/drivers/electron-sign-in-browser.driver";
