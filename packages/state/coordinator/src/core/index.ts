/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/coordinator, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The three methods, their detection, the message type and the
 *           module state stay internal: callers reach them through `electLeader` and `LeaderElection.method`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { ElectionMethod } from "#core/enums/election-method.enum";
export { electLeader } from "#core/functions/elect-leader.function";
export { withTabLock } from "#core/functions/with-tab-lock.function";
export type { ElectLeaderOptions } from "#core/types/elect-leader-options.type";
export type { LeaderElection } from "#core/types/leader-election.type";
