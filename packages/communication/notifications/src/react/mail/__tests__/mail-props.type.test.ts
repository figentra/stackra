/**
 * Stackra file contract:
 * Purpose: type tests of `MailProps`: the resolved type of a notification's `data(event)`, read-only, or its trigger
 *          event when it has no `data` method; a class that is not a notification is refused.
 * Boundary: test only; types only, shaped like the template's order notifications.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0305 (rule 12); ADR 0223.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Notification, NotificationCategory, Recipient } from "#core/index";
import type { MailProps } from "#react/mail/mail-props.type";

class OrderPlaced {
  readonly customerId = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3" as const;
}

class OrderPlacedData {
  order!: { id: string };
  url!: string;
}

class OrderPlacedNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  recipients(event: OrderPlaced): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }

  async data(): Promise<OrderPlacedData> {
    return { order: { id: "ord_1" }, url: "https://acme.example/orders/ord_1" };
  }
}

class OrderShippedNotification extends Notification({ category: NotificationCategory.Activity }) {
  recipients(event: OrderPlaced): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }
}

describe("MailProps", () => {
  it("is the resolved data of the notification, read-only", () => {
    expectTypeOf<MailProps<typeof OrderPlacedNotification>>().toEqualTypeOf<
      Readonly<OrderPlacedData>
    >();
  });

  it("is the trigger event when the notification has no data method", () => {
    expectTypeOf<MailProps<typeof OrderShippedNotification>>().toEqualTypeOf<
      Readonly<OrderPlaced>
    >();
  });

  it("refuses a class that is not a notification", () => {
    // @ts-expect-error MailProps takes a notification class
    const wrong: MailProps<typeof OrderPlacedData> | undefined = undefined;
    expect(wrong).toBeUndefined();
  });
});
