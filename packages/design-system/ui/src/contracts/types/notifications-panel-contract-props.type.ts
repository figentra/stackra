/**
 * Stackra file contract:
 * Purpose: the props every runtime's `NotificationsPanel` takes: the header bell with its unread count, and the panel
 *          it opens (or, inline, the panel in place) with grouped notifications, unread state, per-item actions and
 *          mark-all-read.
 * Boundary: types only. The caller owns the list and its read state; the panel only reports presses.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28, P1 + P2 core); ADR 0302 (decision 3); ADR 0312.
 */
import type { ReactNode } from "react";

import type { NotificationItem } from "#contracts/types/notification-item.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `NotificationsPanel`. */
export interface NotificationsPanelContractProps extends OpenStateContractProps {
  /** The notifications, newest first; the unread count on the bell is counted from them. */
  readonly items: readonly NotificationItem[];
  /** Called with an item's id when it is pressed; without it the rows are not pressable. */
  readonly onItemPress?: ((id: string) => void) | undefined;
  /** Called with an item's id when it is dismissed (its close button, or a swipe on native); without it there is none. */
  readonly onDismiss?: ((id: string) => void) | undefined;
  /** Called by the mark-all-read button, which shows only with it and while something is unread. */
  readonly onMarkAllRead?: (() => void) | undefined;
  /** The bell's accessible name; defaults to "Notifications" with the unread count. */
  readonly label?: string | undefined;
  /** The panel's heading; defaults to "Notifications". */
  readonly title?: string | undefined;
  /** What an empty panel shows; defaults to "You're all caught up". */
  readonly emptyState?: ReactNode | undefined;
  /** Content under the list, such as a "View all" link. */
  readonly footer?: ReactNode | undefined;
  /**
   * Shows the inbox in place, as a card under its heading, for a notifications page or a dashboard tile: no bell, no
   * popover or drawer, and the open state is ignored. Defaults to `false`.
   */
  readonly isInline?: boolean | undefined;
}
