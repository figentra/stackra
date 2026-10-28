/**
 * Stackra file contract:
 * Purpose: `SegmentFactProviderDriver`, segments' driver of the `FactProvider` port of @stackra/rules: the facts of
 *          `SEGMENT_FACTS` for one subject, `{ ids: [...] }`, the public ids of the segments it is a member of.
 * Boundary: reads materialised memberships through `SegmentMembershipService.segmentsOf`, in the caller's transaction
 *           and scope session, so row-level security applies; it never evaluates a segment's rule set (ADR 0332
 *           decision 5). Segments plugs into rules here; rules never names segments (ADR 0462 decision 1).
 * Runtime: node
 * Governing contract: ADR 0331 (decision 4); ADR 0332 (decision 5); ADR 0462 (decision 1).
 */
import { Driver } from "@stackra/container";
import { FactProvider, type FactSubject, type RuleFacts } from "@stackra/rules";

import { SEGMENT_FACTS } from "#core/index";
import type { SegmentMembershipService } from "#node/services/segment-membership.service";

/**
 * Supplies segment membership as facts.
 *
 * @example
 * const facts = await factsFrom([segmentFacts], { model: "commerce.customer", id });
 * // { segments: { ids: ["seg_…"] } }
 */
export class SegmentFactProviderDriver extends Driver(FactProvider) {
  /** The source this driver computes. */
  override readonly source = SEGMENT_FACTS;

  /** Reads memberships. */
  private readonly memberships: SegmentMembershipService;

  /**
   * @param memberships - the membership service.
   */
  constructor(memberships: SegmentMembershipService) {
    super();
    this.memberships = memberships;
  }

  /**
   * The segments `subject` is a member of, as `{ ids }`.
   *
   * @throws Error when the store cannot be reached.
   */
  override async factsOf(subject: FactSubject): Promise<RuleFacts[string]> {
    const segments = await this.memberships.segmentsOf(subject);
    return { ids: segments.map((segment) => segment.id) };
  }
}
