/**
 * Stackra file contract:
 * Purpose: `NotificationDelivery`, one notification prepared for one recipient: the notification, its category, the
 *          recipient, the data every channel renders and the mail channel's message.
 * Boundary: a type only; a `Notifier` driver builds one per recipient and the memory driver keeps them for tests
 *           (`sent(OrderReceiptNotification)`). Nothing here is rendered yet: the mail body and the subject are
 *           rendered in the recipient's locale by the driver that sends.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (notifications); ADR 0266 (decision 2: the memory driver is real).
 */
import type { Notification } from "#core/bases/notification.base";
import type { NotificationCategory } from "#core/enums/notification-category.enum";
import type { MailMessage } from "#core/values/mail-message.value";
import type { Recipient } from "#core/values/recipient.value";

/** A notification for one recipient. */
export interface NotificationDelivery {
  /** The notification instance that produced it. */
  readonly notification: Notification;

  /** The notification's category, for preferences and consent. */
  readonly category: NotificationCategory;

  /** Who it is for. */
  readonly recipient: Recipient;

  /** What `data(event)` returned, or the event when the notification has no `data` method. */
  readonly data: unknown;

  /** The mail channel's message; `null` when the notification has no `mail` method. */
  readonly mail: MailMessage | null;
}
