/**
 * Stackra file contract:
 * Purpose: `groupConversations`, sorts past conversations into the ConversationList's groups: Pinned, Today,
 *          Yesterday, Previous 7 days and Older, by calendar day in the device's time zone, newest first in each.
 * Boundary: pure; `now` is passed in so the caller decides when it ticks. Empty groups are left out; a date in the
 *           future counts as today and an invalid one as older.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ConversationGroupId } from "#contracts/enums/conversation-group-id.enum";
import type { ConversationGroup } from "#contracts/types/conversation-group.type";
import type { ConversationSummary } from "#contracts/types/conversation-summary.type";

/** When a conversation last changed, in milliseconds; 0 (the oldest) for an invalid date. */
const timeOf = (item: ConversationSummary) => new Date(item.updatedAt).getTime() || 0;

/** The conversations in their groups, in drawing order. */
export function groupConversations(
  conversations: readonly ConversationSummary[],
  now: Date,
): readonly ConversationGroup[] {
  const dayStart = (back: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - back).getTime();
  const today = dayStart(0);
  const yesterday = dayStart(1);
  const week = dayStart(7);
  const groupOf = (item: ConversationSummary): ConversationGroupId => {
    if (item.isPinned) return "pinned";
    const at = timeOf(item);
    if (at >= today) return "today";
    if (at >= yesterday) return "yesterday";
    return at >= week ? "previous_7_days" : "older";
  };
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  const newestFirst = [...conversations].sort((a, b) => timeOf(b) - timeOf(a));
  return ConversationGroupId.map((id) => ({
    id,
    items: newestFirst.filter((item) => groupOf(item) === id),
  })).filter((group) => group.items.length > 0);
}
