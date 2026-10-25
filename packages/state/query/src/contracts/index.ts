/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/query (the `QueryPersister`, `QueueLeader`,
 *          `MutationSender`, `AcknowledgementReader`, `ReplicaSource` and `OfflineSession` ports and the types they
 *          name) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { AcknowledgementReader } from "#contracts/ports/acknowledgement-reader.port";
export { MutationSender } from "#contracts/ports/mutation-sender.port";
export { OfflineSession } from "#contracts/ports/offline-session.port";
export { QueryPersister } from "#contracts/ports/query-persister.port";
export { QueueLeader } from "#contracts/ports/queue-leader.port";
export { ReplicaSource } from "#contracts/ports/replica-source.port";
export type { DeviceOrder } from "#contracts/types/device-order.type";
export type { ReplayOutcome } from "#contracts/types/replay-outcome.type";
export type { ReplicaChanges } from "#contracts/types/replica-changes.type";
export type { ReplicaRow } from "#contracts/types/replica-row.type";
