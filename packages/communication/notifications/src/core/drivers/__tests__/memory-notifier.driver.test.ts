/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryNotifierDriver`: a `Notifier` driver that keeps one delivery per recipient in send
 *          order, filters them by notification class, and keeps a list per instance; the template's receipt test reads
 *          it the same way.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0266 (decision 2: the memory driver is real); ADR 0223.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Notification } from "#core/bases/notification.base";
import { MemoryNotifierDriver } from "#core/drivers/memory-notifier.driver";
import { NotificationCategory } from "#core/enums/notification-category.enum";
import { Notifier } from "#core/ports/notifier.port";
import { Recipient } from "#core/values/recipient.value";

const CUSTOMER: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

class OrderPaid {
  readonly customerId = CUSTOMER;
}

class OrderReceiptNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  recipients(event: OrderPaid): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }
}

class OrderPlacedNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  recipients(event: OrderPaid): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }
}

describe("MemoryNotifierDriver", () => {
  it("is a Notifier", () => {
    expect(new MemoryNotifierDriver()).toBeInstanceOf(Notifier);
  });

  it("keeps one delivery per recipient, filtered by class", async () => {
    const notifier = new MemoryNotifierDriver();
    await notifier.notify(new OrderPlacedNotification(), new OrderPaid());
    await notifier.notify(new OrderReceiptNotification(), new OrderPaid());

    const sent = notifier.sent(OrderReceiptNotification);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.recipient).toEqual(Recipient.principal(CUSTOMER));
    expect(notifier.sent().map((delivery) => delivery.notification.constructor)).toEqual([
      OrderPlacedNotification,
      OrderReceiptNotification,
    ]);
  });

  it("keeps a list per instance", async () => {
    const first = new MemoryNotifierDriver();
    await first.notify(new OrderReceiptNotification(), new OrderPaid());
    expect(new MemoryNotifierDriver().sent()).toEqual([]);
  });
});
