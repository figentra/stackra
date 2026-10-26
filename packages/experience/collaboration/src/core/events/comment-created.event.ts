/**
 * Stackra file contract:
 * Purpose: `CommentCreated`, recorded when a comment is posted on a `Commentable` record.
 * Boundary: an integration event, so it leaves through the outbox in the transaction that posted the comment; gen locks
 *           its wire name `collaboration.comment.created.v1`. It never carries the text. It registers this package's
 *           own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 5); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19).
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import type { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { COMMENT_CREATED_SCHEMA } from "#core/constants/comment-created-schema.constant";

/**
 * One comment posted.
 *
 * @example
 * export class NotifyWatchersListener extends Listener {
 *   async handle(event: CommentCreated): Promise<void> { ... }
 * }
 */
export class CommentCreated extends IntegrationEvent({ name: "comment.created" }) {
  /** The comment. */
  commentId!: PublicId<"cmt">;

  /** Its thread. */
  threadId!: PublicId<"cth">;

  /** The commented record's model key. */
  recordModel!: string;

  /** The commented record's public id. */
  recordId!: string;

  /** Who wrote it. */
  authorId!: string;

  /** Who may read it. */
  visibility!: CommentVisibility;
}

registerSchemas([[CommentCreated, COMMENT_CREATED_SCHEMA]]);
