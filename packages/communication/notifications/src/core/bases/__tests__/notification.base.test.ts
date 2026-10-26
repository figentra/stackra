/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Notification`: the called form records the `notification` kind with its category,
 *          keeps `instanceof` and constructor dependencies, refuses a category that is not a `NotificationCategory`,
 *          and lets a subclass declare `data` and `mail` without `override`; a bare `extends Notification` and a
 *          missing `recipients` fail to compile.
 * Boundary: test only; the notification is shaped like the template's order receipt.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 3, 16 and 25); ADR 0223.
 */
import type { PublicId } from "@stackra/contracts";
import { kindOf } from "@stackra/container";
import { keys } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";

import { Notification, NotificationBase } from "#core/bases/notification.base";
import { NotificationCategory } from "#core/enums/notification-category.enum";
import type { NotificationCategory as Category } from "#core/enums/notification-category.enum";
import type { MailMessage } from "#core/values/mail-message.value";
import { Recipient } from "#core/values/recipient.value";

const I18n = keys({ orders: { order_receipt: { mail: ["subject"] } } });

class OrderPaid {
  readonly orderId = "ord_01j9z3k4m5n6p7q8r9s0t1v2w3";
  readonly customerId: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
}

class Orders {
  view(orderId: string): { id: string } {
    return { id: orderId };
  }
}

class OrderReceiptNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  private readonly orders: Orders;

  constructor(orders: Orders) {
    super();
    this.orders = orders;
  }

  recipients(event: OrderPaid): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }

  data(event: OrderPaid): { order: { id: string } } {
    return { order: this.orders.view(event.orderId) };
  }

  mail({ order }: { order: { id: string } }, mail: MailMessage): MailMessage {
    return mail.subject(I18n.orders.order_receipt.mail.subject, { id: order.id });
  }
}

describe("Notification", () => {
  it("records the notification kind with its category", () => {
    expect(kindOf(OrderReceiptNotification)).toEqual({
      kind: "notification",
      options: { category: "transactional" },
    });
  });

  it("keeps instanceof and constructor dependencies", () => {
    const receipt = new OrderReceiptNotification(new Orders());
    expect(receipt).toBeInstanceOf(NotificationBase);
    expect(receipt.recipients(new OrderPaid())).toEqual([
      Recipient.principal("usr_01j9z3k4m5n6p7q8r9s0t1v2w3"),
    ]);
    expect(receipt.data(new OrderPaid()).order.id).toBe("ord_01j9z3k4m5n6p7q8r9s0t1v2w3");
  });

  it("records a delivery service's message category beside the category", () => {
    class SecurityAlertNotification extends Notification({
      category: NotificationCategory.Transactional,
      messageCategory: "security",
    }) {
      recipients(): Recipient[] {
        return [];
      }
    }
    expect(kindOf(SecurityAlertNotification)?.options).toEqual({
      category: "transactional",
      messageCategory: "security",
    });
    expect(() =>
      Notification({ category: NotificationCategory.Activity, messageCategory: "Security!" }),
    ).toThrow(RangeError);
  });

  it("refuses a category that is not a NotificationCategory", () => {
    expect(() => Notification({ category: "urgent" as Category })).toThrow(RangeError);
  });

  it("is called only and needs recipients", () => {
    // @ts-expect-error the category is required, so the bare form does not compile
    class Bare extends Notification {}
    // @ts-expect-error a notification must declare recipients
    class Silent extends Notification({ category: NotificationCategory.Activity }) {}
    expect([Bare, Silent]).toHaveLength(2);
  });
});
