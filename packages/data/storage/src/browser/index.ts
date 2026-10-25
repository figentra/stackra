/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./browser` entry of @stackra/storage (`WebStorageDriver`), the browser-only drivers
 *          gen lists as `Storage` candidates for the web and PWA targets, until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names its one re-export and declares nothing. Imports `.` internals only; never loaded on a server or a
 *           device.
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./browser` entry); the STA-347 stand-in
 *                     barrel decision.
 */
export { WebStorageDriver } from "#browser/drivers/web-storage.driver";
