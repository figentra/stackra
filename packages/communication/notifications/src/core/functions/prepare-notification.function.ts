/**
 * Stackra file contract:
 * Purpose: `prepareNotification(notification, event)`, the step every `Notifier` driver shares: the recipients, then
 *          the data once for every channel, then each channel method's message, as one delivery per recipient.
 * Boundary: internal (the drivers call it). No recipient means no data read. A recipient named twice gets one
 *           delivery. Calls `data` and `mail` as methods, so `this` is the notification. Renders nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (as amended by ADR 0294: channels are the methods present); ADR 0294 (decision 4).
 */
import { kindOf } from "@stackra/container";

import type { Notification } from "#core/bases/notification.base";
import type { NotificationCategory } from "#core/enums/notification-category.enum";
import type { NotificationDelivery } from "#core/types/notification-delivery.type";
import { MailMessage } from "#core/values/mail-message.value";
import { Recipient } from "#core/values/recipient.value";

/** The members a notification may declare beside `recipients`, found by name. */
type NotificationParts = Notification & {
  data?: (event: never) => unknown;
  mail?: (data: never, mail: MailMessage) => MailMessage;
};

/**
 * One delivery per distinct recipient of `notification` for `event`.
 *
 * @throws TypeError when the class does not extend `Notification({ category })`, a recipient is not a `Recipient`,
 *         or `mail()` returns a message without a subject.
 * @example
 * const deliveries = await prepareNotification(receipt, orderPaid);
 */
export async function prepareNotification(
  notification: Notification,
  event: object,
): Promise<NotificationDelivery[]> {
  const name = notification.constructor.name;
  const category = kindOf(notification.constructor)?.options["category"] as
    | NotificationCategory
    | undefined;
  if (category === undefined)
    throw new TypeError(`${name} does not extend Notification({ category })`);

  const recipients: Recipient[] = [];
  const seen = new Set<string>();
  for (const recipient of await notification.recipients(event as never)) {
    if (!(recipient instanceof Recipient))
      throw new TypeError(
        `${name}.recipients() returns Recipient.principal(id) or Recipient.scope(scope) values`,
      );
    const id =
      recipient.principalId === null ? `scope:${recipient.scopeId}` : recipient.principalId;
    if (!seen.has(id)) recipients.push(recipient);
    seen.add(id);
  }
  if (recipients.length === 0) return [];

  const parts = notification as NotificationParts;
  const data = parts.data === undefined ? event : await parts.data(event as never);
  let mail: MailMessage | null = null;
  if (parts.mail !== undefined) {
    mail = parts.mail(data as never, new MailMessage());
    if (!(mail instanceof MailMessage) || mail.subjectKey === null)
      throw new TypeError(
        `${name}.mail() returns mail.subject(I18n.<module>.<notification>.mail.subject, values)`,
      );
  }
  return recipients.map((recipient) =>
    Object.freeze({ notification, category, recipient, data, mail }),
  );
}
