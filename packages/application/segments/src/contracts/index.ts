/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/segments (`SegmentKind`, the `SegmentRef` audience a
 *          consumer stores, the `SubjectRef` a membership names, and the `SegmentSubject` a consumer implements)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15), so IAM and notifications may name a segment audience without the engine.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0332 (decisions 1, 2 and 5); the STA-347 stand-in barrel decision.
 */
export { SegmentKind } from "#contracts/enums/segment-kind.enum";
export type { SegmentRef } from "#contracts/types/segment-ref.type";
export type { SegmentSubject } from "#contracts/types/segment-subject.type";
export type { SubjectRef } from "#contracts/types/subject-ref.type";
