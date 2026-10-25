/**
 * Stackra file contract:
 * Purpose: `MEMORY_ELECTIONS`, the participants of every in-memory election in this realm, by election name, in the
 *          order they joined; the first one leads.
 * Boundary: module state of the memory method only; an entry is removed when its last participant leaves.
 * Runtime: isomorphic
 * Governing contract: ADR 0084 (the coordinator row).
 */
import type { LeaderFlag } from "#core/types/leader-flag.type";

/** Each in-memory election's participants (their leader flags), first joined first. */
export const MEMORY_ELECTIONS = new Map<string, LeaderFlag[]>();
