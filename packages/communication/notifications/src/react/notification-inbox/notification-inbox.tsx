/**
 * Stackra file contract:
 * Purpose: `NotificationInbox`, the notifications kit's web inbox: a header bell with the unread count that opens the
 *          person's notifications, grouped, with mark-all-read, per-item press and dismiss; or, `isInline`, the same
 *          list in place as a card.
 * Boundary: composition of @stackra/ui's NotificationsPanel, with every prop passed through. The host loads the items
 *           (for example from the in-app inbox through its generated client) and owns their read state; the block
 *           only reports presses. The words are the host's `label`, `title` and `emptyState`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0223 (decision 1: the in-app channel); ADR 0165 (UI through
 *                     @stackra/ui); WCAG 2.2 SC 4.1.2.
 */
import { NotificationsPanel } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { NotificationInboxProps } from "#react/notification-inbox/notification-inbox.props";

/**
 * The person's in-app inbox.
 *
 * @example
 * <NotificationInbox items={items} onItemPress={open} onMarkAllRead={markAllRead} />
 */
export function NotificationInbox(props: NotificationInboxProps): ReactElement {
  return <NotificationsPanel {...props} />;
}
