/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/workflow (the cross-service `ServiceAcked` event, its
 *          `KeptRecords` type and the shipped `KeptRecords$`) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15). A service that imports only this entry is hosted contracts-only: it gets the event
 *           and none of the engine, models or migrations (STA-2567).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { KEPT_RECORDS_SCHEMA as KeptRecords$ } from "#contracts/constants/kept-records-schema.constant";
export { ServiceAcked } from "#contracts/events/service-acked.event";
export type { KeptRecords } from "#contracts/types/kept-records.type";
