/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./worker` entry of @stackra/cache (`WorkersCacheDriver`), the driver gen lists for a
 *          web member on Cloudflare Workers, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names its one re-export and declares nothing. Runs in a Worker only: it reads `cloudflare:workers`.
 *           Imports `.` and `./contracts` through their aliases; neither imports it.
 * Runtime: worker
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./worker` entry); the STA-347 stand-in barrel
 *                     decision.
 */
export { WorkersCacheDriver } from "#worker/drivers/workers-cache.driver";
