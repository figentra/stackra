/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/realtime (the Valkey pub/sub fan-out driver and the `lan`
 *          local-network relay driver) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: one driver reaches Valkey through iovalkey, the
 *           other serves node:http.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (an entry exists once its folder has a file);
 *                     the STA-347 stand-in barrel decision.
 */
export { LanRealtimeLocalRelayDriver } from "#node/drivers/lan-realtime-local-relay.driver";
export { ValkeyRealtimeFanoutDriver } from "#node/drivers/valkey-realtime-fanout.driver";
