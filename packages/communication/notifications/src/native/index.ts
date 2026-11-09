/**
 * Stackra file contract:
 * Purpose: the `@stackra/notifications/native` entry: the notifications kit's native blocks, `NotificationInbox` and
 *          `PushPrimer`. The ports they read (`PushRegistration`) and the types they report (`PushPermission`,
 *          `PrimerTrigger`) stay in `./contracts`.
 * Boundary: barrel only; one symbol, one entry (ADR 0294 decision 15). A stand-in for the barrel gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0504 (module UI kits); ADR 0294 (decision 15).
 */
export { NotificationInbox } from "#native/notification-inbox/notification-inbox";
export type { NotificationInboxProps } from "#native/notification-inbox/notification-inbox.props";
export { PushPrimer } from "#native/push-primer/push-primer";
export type { PushPrimerProps } from "#native/push-primer/push-primer.props";
