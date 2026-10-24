/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/query (the `QueryPersister`, `QueueLeader` and
 *          `MutationSender` ports and the `ReplayOutcome` the sender reports) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MutationSender } from "#contracts/ports/mutation-sender.port";
export { QueryPersister } from "#contracts/ports/query-persister.port";
export { QueueLeader } from "#contracts/ports/queue-leader.port";
export type { ReplayOutcome } from "#contracts/types/replay-outcome.type";
