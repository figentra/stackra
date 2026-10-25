/**
 * Stackra file contract:
 * Purpose: `registerNotificationMails({ bodies, catalogues })`, which links each notification class to its `.mail.tsx`
 *          body and records the member's lang loaders, for the `notifications` Notifier driver; gen emits the call.
 * Boundary: startup only; writes `NOTIFICATION_MAILS`. A body must be a component (a function, as gen compiles every
 *           class component), so a wrong value fails here and not at the first send.
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294: bodies bound by name); ADR 0305 (rule 37: compiled class
 *                     components); ADR 0080 (lang loaders).
 */
import { NOTIFICATION_MAILS } from "#node/constants/notification-mails.constant";
import type { NotificationMails } from "#node/types/notification-mails.type";

/**
 * Registers the mail bodies and lang loaders of a member.
 *
 * @throws TypeError when a body is not a component.
 * @example
 * registerNotificationMails({ bodies: [[OrderReceiptNotification, OrderReceiptMail]], catalogues: loaders });
 */
export function registerNotificationMails({ bodies, catalogues }: NotificationMails): void {
  for (const [notification, body] of bodies) {
    if (typeof body !== "function")
      throw new TypeError(`The mail body of ${notification.name} is not a component`);
    NOTIFICATION_MAILS.bodies.set(notification, body);
  }
  for (const [namespace, loaders] of Object.entries(catalogues))
    NOTIFICATION_MAILS.catalogues.set(namespace, loaders);
}
