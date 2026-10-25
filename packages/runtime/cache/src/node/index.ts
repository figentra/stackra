/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/cache (`ValkeyCacheDriver`, the server cache shared by a
 *          member's instances) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Server only: it loads the Valkey client. Imports `.` and
 *           `./contracts` through their aliases; neither imports it.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (runtime-target entries); the STA-347 stand-in
 *                     barrel decision.
 */
export { ValkeyCacheDriver } from "#node/drivers/valkey-cache.driver";
