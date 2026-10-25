/**
 * Stackra file contract:
 * Purpose: `Segment`, a named audience over one subject model: the scope it belongs to, its name, the key of the model
 *          its members are records of, its kind, and for a dynamic segment the rule set that decides its members and
 *          the revision its membership was last computed from.
 * Boundary: data only. Key `segments.segment`, table `segments.segments`, under forced row-level security on
 *           `scope_path`. A dynamic segment links its rule set (`rules.rule_set`) by id; a manual one has none. Its
 *           members are `SegmentMembership` rows. Rows are added through `SegmentService.create`, never with `new`; the
 *           ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0332 (decisions 1 to 3); ADR 0327 (decisions 3 and 9); ADR 0294 (decisions 4, 11, 20 and
 *                     27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { SegmentKind } from "#contracts/index";

/** A segment. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Segment extends Model.with(HasPublicId("seg"), Timestamps) {
  /** The scope node the segment belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The segment's display name. */
  name!: string;

  /** The key of the model its members are records of (`commerce.customer`). */
  subjectModel!: string;

  /** Whether its rule set or a person decides its members. */
  kind!: SegmentKind;

  /** A dynamic segment's rule set; null for a manual one. */
  ruleSetId!: PublicId<"rset"> | null;

  /** The rule set revision the membership was last fully computed from; null before the first computation. */
  revision!: number | null;

  /** When the membership was last fully computed; null before the first computation. */
  computedAt!: Date | null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Segment {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
