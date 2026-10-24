/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `Notifier` port: prepares each notification exactly as a sending driver does and
 *          keeps the deliveries in the process, for dev and a member's tests (`sent(OrderReceiptNotification)`).
 * Boundary: sends nothing and renders nothing; one list per container, in send order. The default driver
 *           (`notifications.driver: memory`), so previews never mail a real address.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0223; ADR 0294 (decisions 16 and 17).
 */
import { type AnyClass, Driver } from "@stackra/container";

import type { Notification } from "#core/bases/notification.base";
import { prepareNotification } from "#core/functions/prepare-notification.function";
import { Notifier } from "#core/ports/notifier.port";
import type { NotificationDelivery } from "#core/types/notification-delivery.type";

/**
 * Keeps deliveries for assertions.
 *
 * @example
 * const sent = (app.get(Notifier) as MemoryNotifier).sent(OrderReceiptNotification);
 * expect(sent[0]?.recipient).toEqual(Recipient.principal(order.customerId));
 */
export class MemoryNotifierDriver extends Driver(Notifier) {
  private readonly deliveries: NotificationDelivery[] = [];

  /** Prepares `notification` for `event` and keeps one delivery per recipient. */
  async notify(notification: Notification, event: object): Promise<void> {
    this.deliveries.push(...(await prepareNotification(notification, event)));
  }

  /** The deliveries kept so far, in order; only those of `type` when it is given. */
  sent(type?: AnyClass<Notification>): readonly NotificationDelivery[] {
    return this.deliveries.filter(
      (delivery) => type === undefined || delivery.notification instanceof type,
    );
  }
}
