/**
 * Stackra file contract:
 * Purpose: `NotificationRowProps`, the props of the native `NotificationRow` in `notification-row.tsx`.
 * Boundary: types only; internal to the NotificationsPanel.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 13.
 */
import type { NotificationItem } from "#contracts/types/notification-item.type";

/** One row: its item, the panel's handlers and the words it needs. */
export interface NotificationRowProps {
  readonly item: NotificationItem;
  readonly onPress?: ((id: string) => void) | undefined;
  readonly onDismiss?: ((id: string) => void) | undefined;
  readonly dismissLabel: string;
  readonly unreadLabel: string;
}
