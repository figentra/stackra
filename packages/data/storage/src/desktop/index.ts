/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./desktop` entry of @stackra/storage (the Electron main-process payload seal) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Main process only: it loads `electron`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./desktop` runtime-target entry); the
 *                     STA-347 stand-in barrel decision.
 */
export { SafeStoragePayloadSealDriver } from "#desktop/drivers/safe-storage-payload-seal.driver";
