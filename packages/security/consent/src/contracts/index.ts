/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/consent, the leaf entry of its port and the type the
 *          port's signature names, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Each
 *           symbol here is exported from this entry only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ConsentStore } from "#contracts/ports/consent-store.port";
export type { ConsentRecord } from "#contracts/types/consent-record.type";
