/**
 * Stackra file contract:
 * Purpose: `SegmentMembershipService`, the module service over `SegmentMembership`: what consumers read (whether a
 *          subject is in a segment, which segments a subject is in, a segment's members page by page) and the two
 *          writes `SegmentService` makes, each with its integration event.
 * Boundary: a `CrudService<SegmentMembership>`, so every read and write runs in the caller's transaction and scope
 *           session, and row-level security limits it to the granted subtrees. Consumers read here and never evaluate
 *           a segment's rule set (ADR 0332 decision 5). `enter` and `leave` record `MembershipEntered` and
 *           `MembershipLeft` on the rows they write and flush at once, so the outbox writes each event in the same
 *           transaction, under the scope session open at that moment, and a duplicate membership surfaces at the call.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 3 to 5); ADR 0327 (decisions 3 and 9); ADR 0105 as amended by ADR 0294;
 *                     ADR 0078 (decision 4).
 */
import { CrudService } from "@stackra/database";

import type { SegmentRef, SubjectRef } from "#contracts/index";
import { MembershipEntered, MembershipLeft } from "#core/index";
import type { Segment } from "#node/models/segment.model";
import type { SegmentMembership } from "#node/models/segment-membership.model";

/**
 * Reads and writes memberships.
 *
 * @example
 * if (await memberships.has({ kind: "segment", id: promotion.segmentId }, { model: "commerce.customer", id })) { ... }
 * const page = await memberships.members(audience, { limit: 500 });
 */
export class SegmentMembershipService extends CrudService<SegmentMembership> {
  /** Whether `subject` is a member of `segment`. */
  async has(segment: SegmentRef, subject: SubjectRef): Promise<boolean> {
    const count = await this.count({
      segmentId: segment.id,
      subjectModel: subject.model,
      subjectId: subject.id,
    });
    return count > 0;
  }

  /** The segments `subject` is a member of. */
  async segmentsOf(subject: SubjectRef): Promise<SegmentRef[]> {
    const rows = await this.find({ subjectModel: subject.model, subjectId: subject.id });
    return rows.map((row) => ({ kind: "segment", id: row.segmentId }));
  }

  /** Up to `page.limit` public ids of `segment`'s members, ascending, after `page.after` (from the first when absent). */
  async members(
    segment: SegmentRef,
    page: { readonly after?: string; readonly limit: number },
  ): Promise<string[]> {
    const rows = await this.find(
      {
        segmentId: segment.id,
        ...(page.after === undefined ? {} : { subjectId: { $gt: page.after } }),
      },
      { orderBy: { subjectId: "asc" }, limit: page.limit },
    );
    return rows.map((row) => row.subjectId);
  }

  /** The memberships of `segment`, all of them or those of `subjectIds`. */
  membersOf(segment: Segment, subjectIds?: readonly string[]): Promise<SegmentMembership[]> {
    return this.find({
      segmentId: segment.id,
      ...(subjectIds === undefined ? {} : { subjectId: { $in: [...subjectIds] } }),
    });
  }

  /**
   * Adds each of `subjectIds` to `segment` and records `MembershipEntered` for it; the caller passes only non-members.
   *
   * @throws UniqueViolation when one is a member already (a concurrent recompute); the caller's retry settles it.
   */
  async enter(segment: Segment, subjectIds: readonly string[]): Promise<void> {
    if (subjectIds.length === 0) return;
    const em = this.em();
    for (const subjectId of new Set(subjectIds)) {
      const row = em.create(this.model(), {
        segmentId: segment.id,
        scopeId: segment.scopeId,
        scopePath: segment.scopePath,
        subjectModel: segment.subjectModel,
        subjectId,
      });
      row.record(
        MembershipEntered.create({
          segmentId: segment.id,
          subjectModel: segment.subjectModel,
          subjectId,
        }),
      );
    }
    await em.flush();
  }

  /** Removes `memberships` and records `MembershipLeft` for each. */
  async leave(memberships: readonly SegmentMembership[]): Promise<void> {
    if (memberships.length === 0) return;
    const em = this.em();
    for (const row of memberships) {
      row.record(
        MembershipLeft.create({
          segmentId: row.segmentId,
          subjectModel: row.subjectModel,
          subjectId: row.subjectId,
        }),
      );
      em.remove(row);
    }
    await em.flush();
  }
}
