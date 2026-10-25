/**
 * Stackra file contract:
 * Purpose: `SegmentRef`, a segment named as the audience of a deny or visibility rule (`{ kind: "segment", id }`).
 * Boundary: a type only; the decision point reads segment membership from the policy snapshot and never evaluates a
 *           segment's rule set (ADR 0332: consumers read membership).
 * Runtime: isomorphic
 * Governing contract: ADR 0333 (decision 2: the audience is a scope node, a segment or a role); ADR 0332.
 */
import type { PublicId } from "@stackra/contracts";

/**
 * A segment as an audience.
 *
 * shortcut: declared here because `@stackra/segments` (wave 7) does not ship its `SegmentRef` yet; import that one and
 * delete this file once it does.
 *
 * @example
 * const vip: SegmentRef = { kind: "segment", id: "seg_01j9z3k4m5n6p7q8r9s0t1v2w1" };
 */
export interface SegmentRef {
  /** Marks the audience as a segment. */
  readonly kind: "segment";

  /** The segment's public id. */
  readonly id: PublicId;
}
