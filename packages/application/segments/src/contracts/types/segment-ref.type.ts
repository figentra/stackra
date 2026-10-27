/**
 * Stackra file contract:
 * Purpose: `SegmentRef`, how a consumer names a segment as an audience: a notification audience, a promotion's
 *          eligibility, an IAM visibility rule (ADR 0333: a scope node, a segment or a role).
 * Boundary: a type only, and JSON as it is, so a consumer stores it in its own record. The `kind` tells it apart in a
 *           consumer's audience union; the consumer reads membership through `SegmentMembershipService`, never by
 *           evaluating the segment's rule set (ADR 0332 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0332 (decision 5); ADR 0333 (the segment audience); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";

/**
 * A segment as an audience.
 *
 * @example
 * const audience: SegmentRef = { kind: "segment", id: segment.id };
 */
export interface SegmentRef {
  /** The reference's kind, always `segment`. */
  readonly kind: "segment";

  /** The segment's public id. */
  readonly id: PublicId<"seg">;
}
