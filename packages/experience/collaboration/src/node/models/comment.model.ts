/**
 * Stackra file contract:
 * Purpose: `Comment`, one comment in a thread: its author, level, text, current mentions, and its edit and tombstone
 *          stamps.
 * Boundary: data only. Key `collaboration.comment`, table `collaboration.comments`, under forced row-level security on
 *           `scope_path`. A delete is a tombstone (`tombstonedAt`), never a row removal; `CommentService.viewOf` hides a
 *           tombstone's text. Earlier texts are `CommentRevision` rows; each mention is also a `CommentMention` row, so
 *           "where was I mentioned" is one indexed read. The text may hold personal data and is never logged.
 * Runtime: node
 * Governing contract: ADR 0433 (decisions 1 to 3); ADR 0327 (decisions 3 and 9); ADR 0294 (decisions 4, 11, 20 and
 *                     27); OS-224 to OS-226.
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import type { MentionTarget } from "#contracts/types/mention-target.type";

/** A comment. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class Comment extends Model.with(HasPublicId("cmt"), Timestamps) {
  /** The thread it belongs to. */
  threadId!: PublicId<"cth">;

  /** The thread's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** Who wrote it; from the actor, never from input. */
  authorId!: string;

  /** Who may read it. */
  visibility!: CommentVisibility;

  /** The current text; hidden in every view once tombstoned. */
  body!: string;

  /** The current mentions, each target once. */
  mentions!: readonly MentionTarget[];

  /** When the text last changed; null if never edited. */
  editedAt!: Date | null;

  /** When it was deleted; the row stays as a tombstone. */
  tombstonedAt!: Date | null;

  /** Who deleted it. */
  tombstonedBy!: string | null;
}

/** Lets an insert of `Comment` leave out the trait timestamps. */
// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface Comment {
  /** The trait timestamps an insert may leave out. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
