/**
 * Stackra file contract:
 * Purpose: `Notification({ category })`, the kind base of a message to people: `recipients(event)` names who hears it,
 *          the type of its parameter is the trigger, an optional `data(event)` reads what every channel renders once,
 *          and each channel is a method the class declares (`mail(data, mail)`); a channel with no method is not sent.
 * Boundary: called only (a category is required, so a bare `extends Notification` fails to compile). The options are
 *           checked and recorded in the kind registry. A binding: dependencies are constructor parameters. The instance
 *           base `NotificationBase` is file-local; `Notification` names its instances. Only `recipients` is declared on
 *           the base: `data` and the channel methods are found by name, so a subclass writes them without `override`.
 *           The key, the trigger, the queue and the mail body are derived by gen.
 * Runtime: isomorphic
 *           An optional `messageCategory` (snake_case) is recorded beside the category for the delivery target.
 * Governing contract: ADR 0294 (decisions 3, 16, 20 and 25); ADR 0223 (as amended by ADR 0294); ADR 0305 (rule 3);
 *                     ADR 0422 (as amended by STA-1235).
 */
import { createKind } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { NotificationCategory } from "#core/enums/notification-category.enum";
import type { NotificationOptions } from "#core/types/notification-options.type";
import type { Recipient } from "#core/values/recipient.value";

/** The instance side every notification shares. */
abstract class NotificationBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a notification. */
  declare readonly "~kind": "notification";

  /**
   * Who hears it, for one event. The subclass types `event` (its trigger); an empty list sends nothing and reads no
   * data.
   */
  abstract recipients(event: never): Recipient[] | Promise<Recipient[]>;
}

/** A notification instance. */
export type Notification = NotificationBase;

/** Checks the options of a notification. */
function read(options: NotificationOptions) {
  if (!Enum.values(NotificationCategory).includes(options?.category))
    throw new RangeError(
      `Notification({ category }) takes a NotificationCategory, got ${JSON.stringify(options?.category)}`,
    );
  const { messageCategory } = options;
  if (messageCategory === undefined) return { category: options.category };
  if (typeof messageCategory !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(messageCategory))
    throw new RangeError(
      `Notification({ messageCategory }) takes a snake_case code, got ${JSON.stringify(messageCategory)}`,
    );
  return { category: options.category, messageCategory };
}

/**
 * The notification kind base.
 *
 * @example
 * export class OrderReceiptNotification extends Notification({
 *   category: NotificationCategory.Transactional,
 * }) {
 *   constructor(orders: OrderService) {
 *     super();
 *     this.orders = orders;
 *   }
 *
 *   recipients(event: OrderPaid): Recipient[] {
 *     return [Recipient.principal(event.customerId)];
 *   }
 *
 *   async data(event: OrderPaid): Promise<OrderReceiptData> {
 *     return OrderReceiptData.create({ order: await this.orders.view(event.orderId) });
 *   }
 *
 *   mail({ order }: OrderReceiptData, mail: MailMessage): MailMessage {
 *     return mail.subject(I18n.orders.order_receipt.mail.subject, { id: order.id });
 *   }
 * }
 */
export const Notification = createKind("notification", NotificationBase, read) as (
  options: NotificationOptions,
) => abstract new () => NotificationBase;
