/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/realtime (the Valkey pub/sub fan-out driver) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the driver reaches Valkey through iovalkey.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { ValkeyRealtimeFanoutDriver } from "#node/drivers/valkey-realtime-fanout.driver";
