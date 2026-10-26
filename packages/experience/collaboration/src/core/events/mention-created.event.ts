/**
 * Stackra file contract:
 * Purpose: `MentionCreated`, recorded once per new mention target of a comment; an assistant mention is how the AI
 *          sidekick is summoned into a thread.
 * Boundary: an integration event, so it leaves through the outbox in the posting transaction; gen locks its wire name
 *           `collaboration.mention.created.v1`. An edit records it only for the targets the edit added. It never
 *           carries the text. It registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decisions 3 and 5); ADR 0141 (2026-10-23 note); OS-226.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import type { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import type { MentionKind } from "#contracts/enums/mention-kind.enum";
import { MENTION_CREATED_SCHEMA } from "#core/constants/mention-created-schema.constant";

/**
 * One target mentioned.
 *
 * @example
 * export class AnswerInThreadListener extends Listener {
 *   async handle(event: MentionCreated): Promise<void> { if (event.kind === MentionKind.Assistant) ... }
 * }
 */
export class MentionCreated extends IntegrationEvent({ name: "mention.created" }) {
  /** The comment holding the mention. */
  commentId!: PublicId<"cmt">;

  /** The thread it belongs to. */
  threadId!: PublicId<"cth">;

  /** The commented record's model key. */
  recordModel!: string;

  /** The commented record's public id. */
  recordId!: string;

  /** Who wrote the mention. */
  mentionedBy!: string;

  /** What the mention points at. */
  kind!: MentionKind;

  /** The target's id; null for the assistant. */
  targetId!: string | null;

  /** The comment's level, so a notifier never tells an outsider about an internal comment. */
  visibility!: CommentVisibility;
}

registerSchemas([[MentionCreated, MENTION_CREATED_SCHEMA]]);
