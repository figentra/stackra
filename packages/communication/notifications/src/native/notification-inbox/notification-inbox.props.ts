/**
 * Stackra file contract:
 * Purpose: `NotificationInboxProps`, what a host hands the native NotificationInbox: the person's notifications, the
 *          handlers for a press, a dismissal and mark-all-read, the open state and the words.
 * Boundary: a type in its own file beside the component (ADR 0305): the props of @stackra/ui's native
 *           NotificationsPanel, unchanged, so the kit block and the panel stay one contract. The host owns the items
 *           and their read state.
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0305; the UI build list (2026-11-02).
 */
import type { NotificationsPanelProps } from "@stackra/ui/native";

/**
 * The inbox's items, handlers, open state and words.
 *
 * @example
 * <NotificationInbox items={items} onItemPress={open} onDismiss={dismiss} isInline title={t(K.title)} />
 */
export type NotificationInboxProps = NotificationsPanelProps;
