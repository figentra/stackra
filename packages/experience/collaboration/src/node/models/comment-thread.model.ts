/**
 * Stackra file contract:
 * Purpose: `CommentThread`, one conversation on a `Commentable` record: the record by model key and public id, an
 *          optional anchor inside it (a block or field a co-edited document names), whether it is open or resolved,
 *          and who opened and resolved it.
 * Boundary: data only. Key `collaboration.comment_thread`, table `collaboration.comment_threads`, under forced
 *           row-level security on `scope_path`. The record is never a foreign key (it may live in another service).
 *           Rows are written only by `CommentService`.
 * Runtime: node
 * Governing contract: ADR 0433 (decision 1); ADR 0225 (decision 3); ADR 0327 (decisions 3 and 9); ADR 0294
 *                     (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { ThreadStatus } from "#contracts/enums/thread-status.enum";

/** A comment thread. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class CommentThread extends Model.with(HasPublicId("cth"), Timestamps) {
  /** The scope node the record belongs to. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The commented record's model key (`legal.matter`). */
  recordModel!: string;

  /** The commented record's public id. */
  recordId!: string;

  /** Where in the record it is anchored (a block id); null for the record as a whole. */
  anchor!: string | null;

  /** Open or resolved. */
  status!: ThreadStatus;

  /** Who opened it. */
  createdBy!: string;

  /** When it was resolved; null while open. */
  resolvedAt!: Date | null;

  /** Who resolved it; null while open. */
  resolvedBy!: string | null;
}

/** Lets an insert of `CommentThread` leave out the trait timestamps. */
// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface CommentThread {
  /** The trait timestamps an insert may leave out. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
