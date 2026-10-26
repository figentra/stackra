/**
 * Stackra file contract:
 * Purpose: `CommentRevision`, one earlier text of a comment, kept on every edit so the history is visible.
 * Boundary: data only, append only. Key `collaboration.comment_revision`, table `collaboration.comment_revisions`,
 *           under forced row-level security on `scope_path`. `createdAt` is the time of the edit that replaced the
 *           text. A tombstone keeps its revisions, unreadable through `CommentService.history`.
 * Runtime: node
 * Governing contract: ADR 0433 (decision 1); OS-225; ADR 0294 (decisions 4, 11, 20 and 27).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

/** An earlier text. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class CommentRevision extends Model.with(HasPublicId("cmr"), Timestamps) {
  /** The comment the text belonged to. */
  commentId!: PublicId<"cmt">;

  /** The comment's scope node. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path. */
  scopePath!: string;

  /** The text before the edit. */
  body!: string;

  /** Who made the edit that replaced it. */
  editedBy!: string;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so a create may leave the trait timestamps out;
// remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface CommentRevision {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
