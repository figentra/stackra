/**
 * Stackra file contract:
 * Purpose: `checkMentions`, the floors on a comment's mentions: each target once, an id on every target but the
 *          assistant, no external participant on an internal comment, and no assistant while it has no handle.
 * Boundary: pure and isomorphic, so a composer previews it; `CommentService` calls it on every post and edit, then asks
 *           the `MentionDirectory` whether the ids exist. The floors are safety, not policy: no setting lowers them.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 3); OS-226.
 */
import { CommentVisibility } from "#contracts/enums/comment-visibility.enum";
import { MentionKind } from "#contracts/enums/mention-kind.enum";
import type { CommentRules } from "#contracts/types/comment-rules.type";
import type { MentionTarget } from "#contracts/types/mention-target.type";
import { MentionNotAllowedError } from "#core/errors/mention-not-allowed.error";

/**
 * The mentions of a comment at `visibility`, each target once, in the order first given.
 *
 * @example
 * checkMentions(CommentVisibility.Internal, [{ kind: MentionKind.Member, id: "usr_1" }], rules);
 * @throws MentionNotAllowedError when a target breaks a floor.
 */
export function checkMentions(
  visibility: CommentVisibility,
  targets: readonly MentionTarget[],
  rules: CommentRules,
): MentionTarget[] {
  const kept = new Map<string, MentionTarget>();
  for (const target of targets) {
    const isAssistant = target.kind === MentionKind.Assistant;
    const isRefused =
      (isAssistant && (rules.assistantHandle === null || rules.assistantHandle === "")) ||
      (!isAssistant && (target.id === null || target.id === "")) ||
      (target.kind === MentionKind.ExternalParticipant &&
        visibility === CommentVisibility.Internal);
    if (isRefused) throw MentionNotAllowedError.create({ kind: target.kind });
    const clean = { kind: target.kind, id: isAssistant ? null : target.id };
    kept.set(`${clean.kind}:${clean.id ?? ""}`, clean);
  }
  return [...kept.values()];
}
