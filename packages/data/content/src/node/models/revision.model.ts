/**
 * Stackra file contract:
 * Purpose: `Revision`, one numbered revision of a record of a `HasRevisions` model: the record's model key and public
 *          id, the revision's number, the frozen snapshot it holds, and when it was last published.
 * Boundary: data only. Key `content.revision`, table `content.revisions`, under forced row-level security on
 *           `scope_path`; unique per model, record and number. `data` is written once and never changed: a change is
 *           a new revision. A revision with no `publishedAt` is a draft; publishing sets it, and publishing an older
 *           revision again makes it the current one. A scheduled revision carries `scheduledAt` and an optional
 *           `campaign` until it is published or unscheduled. Rows are written by the owning package's service, never with
 *           `new`; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 2); ADR 0116 (decision CT3); ADR 0327 (decisions 3 and 9); ADR 0294
 *                     (decisions 4, 11, 20 and 27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** A revision of one record. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Revision extends Model.with(HasPublicId("rev"), Timestamps) {
  /** The scope node of the record. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The key of the record's model (`rules.rule_set`). */
  model!: string;

  /** The record's public id. */
  recordId!: string;

  /** The revision's number for its record, from 1. */
  number!: number;

  /** The record's content at this revision, as JSON; never changed once written. */
  data!: Readonly<Record<string, unknown>>;

  /** When the revision was last published; null for a draft. */
  publishedAt: Date | null = null;

  /** When a scheduled revision goes live; null unless scheduled (`Schedulable`). */
  scheduledAt: Date | null = null;

  /** The campaign key that groups scheduled revisions; null for none. */
  campaign: string | null = null;
}

/** The insert-optional fields of `Revision`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.insert` may leave the trait timestamps
// and the draft's `publishedAt` out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Revision {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "createdAt" | "updatedAt" | "publishedAt" | "scheduledAt" | "campaign";
}
