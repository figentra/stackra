/**
 * Stackra file contract:
 * Purpose: `SegmentMembership`, one subject in one segment, materialised: the segment, the subject record named by its
 *          model key and public id, and the segment's scope.
 * Boundary: data only. Key `segments.segment_membership`, table `segments.segment_memberships`, under forced row-level
 *           security on `scope_path`; unique per segment and subject, deleted with its segment. `createdAt` is when the
 *           subject entered. A row is written and removed only by `SegmentMembershipService`, which records
 *           `MembershipEntered` or `MembershipLeft` with it; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 3 and 4); ADR 0327 (decisions 3 and 9); ADR 0294 (decisions 4, 11, 20 and
 *                     27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** A membership. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class SegmentMembership extends Model.with(HasPublicId("sgm"), Timestamps) {
  /** The segment. */
  segmentId!: PublicId<"seg">;

  /** The segment's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The subject model's key (`commerce.customer`). */
  subjectModel!: string;

  /** The subject's public id. */
  subjectId!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out; remove
// it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface SegmentMembership {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
