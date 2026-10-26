/**
 * Stackra file contract:
 * Purpose: `CommentView`, a comment as every reader sees it: a tombstone shows no text and no mentions.
 * Boundary: a type only, built by `CommentService.viewOf`, the one mapping from row to view.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decisions 1 and 5); OS-225.
 */
import type { PublicId } from "@stackra/contracts";

import type { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import type { MentionTarget } from "#contracts/types/mention-target.type";

/** A comment for display. */
export interface CommentView {
  /** The comment's public id. */
  readonly id: PublicId<"cmt">;

  /** The thread it belongs to. */
  readonly threadId: PublicId<"cth">;

  /** Who wrote it. */
  readonly authorId: string;

  /** Who may read it. */
  readonly visibility: CommentVisibility;

  /** The text; null for a tombstone. */
  readonly body: string | null;

  /** The mentions; empty for a tombstone. */
  readonly mentions: readonly MentionTarget[];

  /** When it was posted. */
  readonly createdAt: Date;

  /** When its text last changed; null if never edited. */
  readonly editedAt: Date | null;

  /** When it was deleted; null while it stands. */
  readonly tombstonedAt: Date | null;
}
