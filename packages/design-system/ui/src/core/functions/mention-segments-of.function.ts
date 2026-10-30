/**
 * Stackra file contract:
 * Purpose: `mentionSegmentsOf`, a comment's text cut into plain runs and `@Name` mentions of known people, so a
 *          renderer can mark the mentions; and the ids it mentions.
 * Boundary: pure. Longer names win (`@Sara Ali` before `@Sara`); unknown `@words` stay plain text.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (comments); STA-1371.
 */
import type { MentionSegment } from "#core/types/mention-segment.type";
import type { CommentPerson } from "#contracts/types/comment-person.type";

/** The segments of `body` and the people it mentions. */
export function mentionSegmentsOf(
  body: string,
  people: readonly CommentPerson[],
): { readonly segments: readonly MentionSegment[]; readonly mentions: readonly string[] } {
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const names = [...people].sort((a, b) => b.name.length - a.name.length);
  const segments: MentionSegment[] = [];
  const mentions = new Set<string>();
  let plain = "";
  let index = 0;
  while (index < body.length) {
    const atStart = body[index] === "@" && (index === 0 || /\s/u.test(body[index - 1] ?? ""));
    const after = index + 1;
    const person = atStart
      ? names.find((candidate) => body.startsWith(candidate.name, after))
      : undefined;
    if (person) {
      if (plain) segments.push({ text: plain });
      plain = "";
      segments.push({ text: `@${person.name}`, person });
      mentions.add(person.id);
      index += person.name.length + 1;
    } else {
      plain += body[index];
      index += 1;
    }
  }
  if (plain) segments.push({ text: plain });
  return { segments, mentions: [...mentions] };
}
