/**
 * Stackra file contract:
 * Purpose: `CommentService`, the module service over `Comment`: posts a comment on any `Commentable` record (opening a
 *          thread, or replying in one and reopening it), edits with a revision, tombstones, resolves a thread, and reads
 *          threads, comments, history and a target's mentions, with the one mapping from row to `CommentView`.
 * Boundary: a `CrudService<Comment>`, so every write runs in the caller's transaction and scope session; events are
 *           recorded on the comment and reach the outbox at flush, so a rolled-back write emits nothing. The level and
 *           mention floors are code (an external author never posts internal, an external participant is never
 *           mentioned on an internal comment, a tombstone never shows its text, a held comment never changes); whether
 *           shared comments are open and the assistant's handle are the consumer's settings (`CommentRules`). Who may
 *           edit or delete (the author, a moderator) is the consumer's policy. Holds are asked of @stackra/database's
 *           `HoldRegistry` through `disposableIds`; an edit asks as a delete (no edit disposal exists yet).
 * Runtime: node
 * Governing contract: ADR 0433 (decisions 1 to 5); ADR 0225 (decision 3); ADR 0134 (holds); ADR 0105 as amended by
 *                     ADR 0294; OS-224 to OS-226.
 */
import type { Clock, PublicId, ScopeRef } from "@stackra/contracts";
import { CrudService, disposableIds, RecordHeldError } from "@stackra/database";
import { Disposal } from "@stackra/database/contracts";
import { NotFoundError } from "@stackra/errors";

import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import { ThreadStatus } from "#contracts/enums/thread-status.enum";
import type { MentionDirectory } from "#contracts/ports/mention-directory.port";
import type { CommentRules } from "#contracts/types/comment-rules.type";
import type { CommentView } from "#contracts/types/comment-view.type";
import type { CommentableRef } from "#contracts/types/commentable-ref.type";
import type { MentionTarget } from "#contracts/types/mention-target.type";
import { CommentTombstonedError } from "#core/errors/comment-tombstoned.error";
import { CommentVisibilityNotAllowedError } from "#core/errors/comment-visibility-not-allowed.error";
import { MentionNotAllowedError } from "#core/errors/mention-not-allowed.error";
import { CommentCreated } from "#core/events/comment-created.event";
import { MentionCreated } from "#core/events/mention-created.event";
import { checkMentions } from "#core/functions/check-mentions.function";
import { Comment } from "#node/models/comment.model";
import { CommentMention } from "#node/models/comment-mention.model";
import { CommentRevision } from "#node/models/comment-revision.model";
import { CommentThread } from "#node/models/comment-thread.model";

/** The identity of a mention target, for the edit diff. */
const keyOf = (target: MentionTarget): string => `${target.kind}:${target.id ?? ""}`;

/**
 * Posts, edits, tombstones and reads comments.
 *
 * @example
 * const comment = await comments.post(ctx.scope, { record, body, visibility, mentions, isExternalAuthor }, actor.id, rules);
 * await comments.edit(comment.id, body, mentions, actor.id, rules);
 * await comments.tombstone(comment.id, actor.id);
 */
export class CommentService extends CrudService<Comment> {
  /** Says which mention targets do not exist. */
  private readonly directory: MentionDirectory;

  /** The time of an edit, a tombstone and a resolve. */
  private readonly clock: Clock;

  /**
   * @param directory - the consumer's mention directory.
   * @param clock - the clock.
   */
  constructor(directory: MentionDirectory, clock: Clock) {
    super();
    this.directory = directory;
    this.clock = clock;
  }

  /**
   * Posts a comment by `authorId` on `draft.record` in `scope`: in `draft.threadId` (reopened when resolved) or in a
   * new thread at `draft.anchor`. Records `CommentCreated` and one `MentionCreated` per target, and flushes.
   *
   * @throws CommentVisibilityNotAllowedError when the level is not open to the author.
   * @throws MentionNotAllowedError when a mention breaks a floor or names an unknown target.
   * @throws NotFoundError when `draft.threadId` is not a visible thread of `draft.record`.
   */
  async post(
    scope: ScopeRef,
    draft: {
      readonly record: CommentableRef;
      readonly threadId?: PublicId<"cth">;
      readonly anchor?: string | null;
      readonly body: string;
      readonly visibility: CommentVisibility;
      readonly mentions: readonly MentionTarget[];
      readonly isExternalAuthor: boolean;
    },
    authorId: string,
    rules: CommentRules,
  ): Promise<Comment> {
    const { record, visibility } = draft;
    if (
      (draft.isExternalAuthor && visibility === CommentVisibility.Internal) ||
      (visibility === CommentVisibility.Shared && !rules.sharedComments)
    )
      throw CommentVisibilityNotAllowedError.create({ visibility });
    const mentions = await this.checked(scope, record, visibility, draft.mentions, rules);
    const em = this.em();
    const thread =
      draft.threadId === undefined
        ? em.create(CommentThread, {
            scopeId: scope.id,
            scopePath: scope.path,
            recordModel: record.model,
            recordId: record.id,
            anchor: draft.anchor ?? null,
            status: ThreadStatus.Open,
            createdBy: authorId,
            resolvedAt: null,
            resolvedBy: null,
          })
        : await this.threadOf(draft.threadId, record);
    if (thread.status === ThreadStatus.Resolved) {
      thread.status = ThreadStatus.Open;
      thread.resolvedAt = null;
      thread.resolvedBy = null;
    }
    const comment = em.create(this.model(), {
      threadId: thread.id,
      scopeId: scope.id,
      scopePath: scope.path,
      authorId,
      visibility,
      body: draft.body,
      mentions,
      editedAt: null,
      tombstonedAt: null,
      tombstonedBy: null,
    });
    comment.record(
      CommentCreated.create({
        commentId: comment.id,
        threadId: thread.id,
        recordModel: record.model,
        recordId: record.id,
        authorId,
        visibility,
      }),
    );
    this.announce(comment, thread, mentions);
    await em.flush();
    return comment;
  }

  /**
   * Replaces a comment's text and mentions, keeps the old text as a revision, records `MentionCreated` only for the
   * targets the edit added, and flushes.
   *
   * @throws CommentTombstonedError when it is a tombstone.
   * @throws RecordHeldError when a legal hold covers it.
   * @throws MentionNotAllowedError when a mention breaks a floor or names an unknown target.
   * @throws NotFoundError when it is not visible.
   */
  async edit(
    commentId: PublicId<"cmt">,
    body: string,
    targets: readonly MentionTarget[],
    editorId: string,
    rules: CommentRules,
  ): Promise<Comment> {
    const comment = await this.findOneOrFail({ id: commentId });
    if (comment.tombstonedAt !== null) throw CommentTombstonedError.create({ commentId });
    await this.assertNotHeld(comment);
    const em = this.em();
    const thread = await em.findOneOrFail(CommentThread, { id: comment.threadId });
    const scope = { id: comment.scopeId, path: comment.scopePath };
    const record = { model: thread.recordModel, id: thread.recordId };
    const mentions = await this.checked(scope, record, comment.visibility, targets, rules);
    const before = new Set(comment.mentions.map(keyOf));
    em.create(CommentRevision, {
      commentId,
      scopeId: comment.scopeId,
      scopePath: comment.scopePath,
      body: comment.body,
      editedBy: editorId,
    });
    comment.body = body;
    comment.editedAt = this.clock.now();
    comment.mentions = mentions;
    for (const row of await em.find(CommentMention, { commentId })) em.remove(row);
    this.announce(comment, thread, mentions, before);
    await em.flush();
    return comment;
  }

  /**
   * Leaves a tombstone: the row stays, its text is hidden and its mentions stop. A second call changes nothing.
   *
   * @throws RecordHeldError when a legal hold covers it.
   * @throws NotFoundError when it is not visible.
   */
  async tombstone(commentId: PublicId<"cmt">, by: string): Promise<void> {
    const comment = await this.findOneOrFail({ id: commentId });
    if (comment.tombstonedAt !== null) return;
    await this.assertNotHeld(comment);
    comment.tombstonedAt = this.clock.now();
    comment.tombstonedBy = by;
    comment.mentions = [];
    const em = this.em();
    for (const row of await em.find(CommentMention, { commentId })) em.remove(row);
    await em.flush();
  }

  /**
   * Marks a thread resolved by `by`; resolving a resolved thread changes nothing.
   *
   * @throws NotFoundError when it is not visible.
   */
  async resolveThread(threadId: PublicId<"cth">, by: string): Promise<CommentThread> {
    const em = this.em();
    const thread = await em.findOneOrFail(CommentThread, { id: threadId });
    if (thread.status === ThreadStatus.Resolved) return thread;
    thread.status = ThreadStatus.Resolved;
    thread.resolvedAt = this.clock.now();
    thread.resolvedBy = by;
    await em.flush();
    return thread;
  }

  /** The threads of `record`, oldest first. */
  threadsOf(record: CommentableRef): Promise<CommentThread[]> {
    return this.em().find(
      CommentThread,
      { recordModel: record.model, recordId: record.id },
      { orderBy: { createdAt: "asc" } },
    );
  }

  /** The comments of a thread, oldest first (tombstones included: map them through `viewOf`). */
  commentsOf(threadId: PublicId<"cth">): Promise<Comment[]> {
    return this.find({ threadId }, { orderBy: { createdAt: "asc" } });
  }

  /**
   * A comment's earlier texts, newest first; none for a tombstone.
   *
   * @throws NotFoundError when it is not visible.
   */
  async history(commentId: PublicId<"cmt">): Promise<CommentRevision[]> {
    const comment = await this.findOneOrFail({ id: commentId });
    if (comment.tombstonedAt !== null) return [];
    return this.em().find(CommentRevision, { commentId }, { orderBy: { createdAt: "desc" } });
  }

  /** The live mentions of `target`, newest first. */
  mentionsOf(target: MentionTarget): Promise<CommentMention[]> {
    return this.em().find(
      CommentMention,
      { kind: target.kind, targetId: target.id },
      { orderBy: { createdAt: "desc" } },
    );
  }

  /** The one mapping from row to view; a tombstone shows no text and no mentions. */
  viewOf(comment: Comment): CommentView {
    const isGone = comment.tombstonedAt !== null;
    return {
      id: comment.id,
      threadId: comment.threadId,
      authorId: comment.authorId,
      visibility: comment.visibility,
      body: isGone ? null : comment.body,
      mentions: isGone ? [] : comment.mentions,
      createdAt: comment.createdAt,
      editedAt: comment.editedAt,
      tombstonedAt: comment.tombstonedAt,
    };
  }

  /** The floors of `checkMentions`, then the directory's answer for every target but the assistant. */
  private async checked(
    scope: ScopeRef,
    record: CommentableRef,
    visibility: CommentVisibility,
    targets: readonly MentionTarget[],
    rules: CommentRules,
  ): Promise<MentionTarget[]> {
    const mentions = checkMentions(visibility, targets, rules);
    const people = mentions.filter((target) => target.kind !== MentionKind.Assistant);
    if (people.length === 0) return mentions;
    const [unknown] = await this.directory.unknownAmong(scope, record, people);
    if (unknown !== undefined) throw MentionNotAllowedError.create({ kind: unknown.kind });
    return mentions;
  }

  /** The thread `threadId`, which must hang on `record`. */
  private async threadOf(
    threadId: PublicId<"cth">,
    record: CommentableRef,
  ): Promise<CommentThread> {
    const thread = await this.em().findOne(CommentThread, { id: threadId });
    if (thread === null || thread.recordModel !== record.model || thread.recordId !== record.id)
      throw NotFoundError.create();
    return thread;
  }

  /** Writes a mention row per target and records `MentionCreated` for each target not in `before`. */
  private announce(
    comment: Comment,
    thread: CommentThread,
    targets: readonly MentionTarget[],
    before: ReadonlySet<string> = new Set(),
  ): void {
    const em = this.em();
    for (const target of targets) {
      em.create(CommentMention, {
        commentId: comment.id,
        threadId: thread.id,
        scopeId: comment.scopeId,
        scopePath: comment.scopePath,
        kind: target.kind,
        targetId: target.id,
      });
      if (before.has(keyOf(target))) continue;
      comment.record(
        MentionCreated.create({
          commentId: comment.id,
          threadId: thread.id,
          recordModel: thread.recordModel,
          recordId: thread.recordId,
          mentionedBy: comment.authorId,
          kind: target.kind,
          targetId: target.id,
          visibility: comment.visibility,
        }),
      );
    }
  }

  /** @throws RecordHeldError when a legal hold covers the comment. */
  private async assertNotHeld(comment: Comment): Promise<void> {
    const [free] = await disposableIds(Comment, [comment.id], Disposal.Delete);
    if (free === undefined)
      throw RecordHeldError.create({ model: "collaboration.comment", id: comment.id });
  }
}
