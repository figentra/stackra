/**
 * Stackra file contract:
 * Purpose: `AwardKind`, one kind of award a scope grants (employee of the month, a belt grading, a course
 *          completion): its key and name, the recipient model it is granted to, its ordered levels, whether levels
 *          must ascend and whether it is once per period, its criteria rule set for automatic grants, the print
 *          template of its certificate, and whether it is still granted.
 * Boundary: data only, seeded from a product's seed pack and edited in its admin: which kinds exist is never code.
 *           Key `achievements.award_kind`, table `achievements.award_kinds`, under forced row-level security on
 *           `scope_path`. The criteria link a `rules.rule_set` by id; the template is a @stackra/documents template
 *           key. Rows are added through `AwardKindService.open`; the ORM loads rows without the constructor.
 * Runtime: node
 * Governing contract: ADR 0368 (decisions 1 to 4 and 6); ADR 0363 (decision 2); ADR 0327 (decisions 3 and 9);
 *                     ADR 0294 (decisions 4, 11, 20 and 27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** An award kind. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class AwardKind extends Model.with(HasPublicId("awk"), Timestamps) {
  /** The scope node the kind belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The kind's stable key in its scope (`employee_of_month`), the handle a seed pack names. */
  key!: string;

  /** The kind's display name. */
  name!: string;

  /** The key of the model its awards are granted to (`workforce.member`). */
  recipientModel!: string;

  /** Its levels, lowest first; empty for a kind with no levels. */
  levels!: readonly string[];

  /** Whether a recipient's next level must be above the highest it holds. */
  isAscending!: boolean;

  /** Whether a recipient holds at most one live award of the kind per period. */
  isOncePerPeriod!: boolean;

  /** The rule set whose published revision grants the kind automatically; null for a kind granted by hand only. */
  ruleSetId!: PublicId<"rset"> | null;

  /** The @stackra/documents template key of its certificate; null for a kind with no certificate. */
  certificateTemplate!: string | null;

  /** Whether the kind is still granted; an archived kind keeps its awards. */
  isActive!: boolean;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
/** The props a create of `AwardKind` may leave out. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface AwardKind {
  /** The trait timestamps, which the database fills in. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
