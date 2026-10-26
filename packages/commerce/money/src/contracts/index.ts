/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/money, the leaf entry of the `RateSource` port and the
 *          types its signature names, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. The port is
 *           exported from here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { RateSource } from "#contracts/ports/rate-source.port";
export type { MoneyAmount } from "#contracts/types/money-amount.type";
export type { RatePair } from "#contracts/types/rate-pair.type";
export type { RateSnapshot } from "#contracts/types/rate-snapshot.type";
