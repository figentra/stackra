/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./node` entry of @stackra/notifications (`NotificationsNotifierDriver`, the
 *          `notifications` Notifier driver the template's wiring imports, and `registerNotificationMails`, which gen's
 *          registration calls) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Server only: the driver queues through `@stackra/clients` and
 *           renders the `.mail.tsx` bodies with `react-dom/server`, so `react` and `react-dom` are required here. The
 *           client and the descriptor of the notifications service stay internal.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { NotificationsNotifierDriver } from "#node/drivers/notifications-notifier.driver";
export { registerNotificationMails } from "#node/functions/register-notification-mails.function";
export type { NotificationMails } from "#node/types/notification-mails.type";
