/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/collaboration (the `memory` drivers of the four ports:
 *          the fake presence channel, the fake sync relay, the fake snapshot store and the fake mention directory) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's `./contracts` only; no other package's
 *           `./testing` (ADR 0269 decision 3).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { MemoryMentionDirectoryDriver } from "#testing/drivers/memory-mention-directory.driver";
export { MemoryPresenceChannelDriver } from "#testing/drivers/memory-presence-channel.driver";
export { MemorySnapshotStoreDriver } from "#testing/drivers/memory-snapshot-store.driver";
export { MemorySyncTransportDriver } from "#testing/drivers/memory-sync-transport.driver";
