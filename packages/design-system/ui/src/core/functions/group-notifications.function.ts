/**
 * Stackra file contract:
 * Purpose: `groupNotifications(items)`, the notifications split by their `group` heading, groups in the order each
 *          heading first appears and items in their given order.
 * Boundary: pure; internal, the web and native `NotificationsPanel` import it by path.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0305.
 */
import type { NotificationItem } from "#contracts/types/notification-item.type";
import type { NotificationGroup } from "#core/types/notification-group.type";

/** The items under their headings, in first-appearance order. */
export function groupNotifications(items: readonly NotificationItem[]): NotificationGroup[] {
  const groups = new Map<string | undefined, NotificationItem[]>();
  for (const item of items) {
    const list = groups.get(item.group);
    if (list) list.push(item);
    else groups.set(item.group, [item]);
  }
  return [...groups].map(([heading, grouped]) => ({ heading, items: grouped }));
}
