/**
 * Stackra file contract:
 * Purpose: `SegmentKindMismatchError`, the refusal of a change the segment's kind does not allow: a condition drafted or
 *          published for a manual segment, or a subject added to or removed from a dynamic one by hand. A 412.
 * Boundary: a refusal; it names the segment and its kind, never a subject.
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decision 2); ADR 0140 (error envelope); ADR 0294 (decision 20: the code from the class
 *                     name).
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind, Refusal } from "@stackra/errors";

import type { SegmentKind } from "#contracts/index";

/**
 * A change of the other kind of segment.
 *
 * @example
 * throw SegmentKindMismatchError.create({ segmentId, segmentKind: SegmentKind.Dynamic });
 */
export class SegmentKindMismatchError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The segment refused. */
  segmentId!: PublicId<"seg">;

  /** Its kind, which the change does not fit. */
  segmentKind!: SegmentKind;
}
