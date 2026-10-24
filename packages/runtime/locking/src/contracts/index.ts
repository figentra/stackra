/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/locking (the `LockDriver` port and the `LockLease` type
 *          it uses) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { LockDriver } from "#contracts/ports/lock-driver.port";
export type { LockLease } from "#contracts/types/lock-lease.type";
