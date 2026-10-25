/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/segments (the `MembershipEntered` and `MembershipLeft` integration
 *          events and the kind refusal) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Isomorphic: a consuming service's listener imports the events
 *           without the ORM. The shipped event schema stays internal. The contracts are `./contracts`'; the models,
 *           services, recompute job, change consumer and subject registration are `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0332 (decisions 2 and 4); the STA-347 stand-in barrel decision.
 */
export { SegmentKindMismatchError } from "#core/errors/segment-kind-mismatch.error";
export { MembershipEntered } from "#core/events/membership-entered.event";
export { MembershipLeft } from "#core/events/membership-left.event";
