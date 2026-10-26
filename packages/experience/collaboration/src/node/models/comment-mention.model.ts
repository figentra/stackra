/**
 * Stackra file contract:
 * Purpose: `CommentMention`, one live mention of a target in a comment, so a member's "mentions" inbox and a team's
 *          feed are one indexed read.
 * Boundary: data only. Key `collaboration.comment_mention`, table `collaboration.comment_mentions`, under forced
 *           row-level security on `scope_path`. Kept equal to `Comment.mentions` by `CommentService`: an edit
 *           replaces the rows, a tombstone removes them.
 * Runtime: node
 * Governing contract: ADR 0433 (decision 3); OS-226; ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { MentionKind } from "#contracts/enums/mention-kind.enum";

/** A mention row. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class CommentMention extends Model.with(HasPublicId("cmn"), Timestamps) {
  /** The comment holding the mention. */
  commentId!: PublicId<"cmt">;

  /** The thread it belongs to. */
  threadId!: PublicId<"cth">;

  /** The comment's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path. */
  scopePath!: string;

  /** What the mention points at. */
  kind!: MentionKind;

  /** The target's id; null for the assistant. */
  targetId!: string | null;
}

/** Lets an insert of `CommentMention` leave out the trait timestamps. */
// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface CommentMention {
  /** The trait timestamps an insert may leave out. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
