/**
 * Stackra file contract:
 * Purpose: `NotificationRowProps`, the props of the web `NotificationRow` in `notification-row.tsx`.
 * Boundary: types only; internal to the NotificationsPanel.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 13.
 */
import type { NotificationItem } from "#contracts/types/notification-item.type";

/** One row: its item, the panel's handlers and the words it needs. */
export interface NotificationRowProps {
  /** The notification the row draws. */
  readonly item: NotificationItem;
  /** Called with the item id when the row is pressed. */
  readonly onPress?: ((id: string) => void) | undefined;
  /** Called with the item id when it is dismissed. */
  readonly onDismiss?: ((id: string) => void) | undefined;
  /** The accessible name of the dismiss button. */
  readonly dismissLabel: string;
  /** The spoken word for an unread item. */
  readonly unreadLabel: string;
}
