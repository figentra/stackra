/**
 * Stackra file contract:
 * Purpose: `ELECTION_PREFIX`, put in front of an election's name to make its Web Lock name and its BroadcastChannel
 *          name, so a Stackra election never collides with a lock or channel the app opens itself.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row).
 */

/** The prefix of every lock and channel name this package opens. */
export const ELECTION_PREFIX = "stackra.coordinator:";
