/**
 * Stackra file contract:
 * Purpose: `NotificationInbox`, the notifications kit's native inbox: a header bell with the unread count that opens the
 *          person's notifications, grouped, with mark-all-read, per-item press and swipe to dismiss; or, `isInline`,
 *          the same list in place for a notifications screen.
 * Boundary: composition of @stackra/ui's native NotificationsPanel, with every prop passed through. The host loads the
 *           items and owns their read state; the block only reports presses. The words are the host's `label`,
 *           `title` and `emptyState`.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0223 (decision 1: the in-app channel); ADR 0302 (decision 3:
 *                     native UI from @stackra/ui).
 */
import { NotificationsPanel } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { NotificationInboxProps } from "#native/notification-inbox/notification-inbox.props";

/**
 * The person's in-app inbox.
 *
 * @example
 * <NotificationInbox items={items} onItemPress={open} onDismiss={dismiss} isInline />
 */
export function NotificationInbox(props: NotificationInboxProps): ReactElement {
  return <NotificationsPanel {...props} />;
}
