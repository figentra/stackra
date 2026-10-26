/**
 * Stackra file contract:
 * Purpose: unit tests of `prepareNotification`: one frozen delivery per distinct recipient (an address included) with
 *          the category, the data read once and the mail message; no data read for no recipient; the event as data
 *          when there is no `data` method; no mail without a `mail` method; and a TypeError for a class of another
 *          kind, a value that is not a `Recipient` and a mail without a subject.
 * Boundary: test only; `vi.fn` counts the data reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223 (as amended by ADR 0294); ADR 0269 (vi from vitest).
 */
import type { PublicId } from "@stackra/contracts";
import { keys } from "@stackra/i18n";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  Notification,
  type Notification as NotificationInstance,
} from "#core/bases/notification.base";
import { NotificationCategory } from "#core/enums/notification-category.enum";
import { prepareNotification } from "#core/functions/prepare-notification.function";
import type { MailMessage } from "#core/values/mail-message.value";
import { Recipient } from "#core/values/recipient.value";

const I18n = keys({ orders: { order_receipt: { mail: ["subject"] } } });
const ADA: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const BEN: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";

class OrderPaid {
  readonly orderId = "ord_1";

  readonly customers: readonly PublicId<"usr">[];

  constructor(customers: readonly PublicId<"usr">[]) {
    this.customers = customers;
  }
}

const read = vi.fn((orderId: string) => ({ id: orderId }));

class OrderReceiptNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  recipients(event: OrderPaid): Recipient[] {
    return event.customers.map((id) => Recipient.principal(id));
  }

  async data(event: OrderPaid): Promise<{ order: { id: string } }> {
    return { order: read(event.orderId) };
  }

  mail({ order }: { order: { id: string } }, mail: MailMessage): MailMessage {
    return mail.subject(I18n.orders.order_receipt.mail.subject, { id: order.id });
  }
}

class OrderShippedNotification extends Notification({ category: NotificationCategory.Activity }) {
  async recipients(event: OrderPaid): Promise<Recipient[]> {
    return [Recipient.principal(event.customers[0] ?? ADA)];
  }
}

describe("prepareNotification", () => {
  it("prepares one frozen delivery per distinct recipient, reading data once", async () => {
    read.mockClear();
    const receipt = new OrderReceiptNotification();
    const deliveries = await prepareNotification(receipt, new OrderPaid([ADA, BEN, ADA]));
    expect(read).toHaveBeenCalledTimes(1);
    expect(deliveries.map((delivery) => delivery.recipient)).toEqual([
      Recipient.principal(ADA),
      Recipient.principal(BEN),
    ]);
    const [first] = deliveries;
    expect(first?.notification).toBe(receipt);
    expect(first?.category).toBe(NotificationCategory.Transactional);
    expect(first?.data).toEqual({ order: { id: "ord_1" } });
    expect(first?.mail?.subjectKey).toBe(I18n.orders.order_receipt.mail.subject);
    expect(first?.mail?.subjectValues).toEqual({ id: "ord_1" });
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("prepares one delivery per distinct address, beside a principal", async () => {
    class InvitationNotification extends Notification({
      category: NotificationCategory.Transactional,
    }) {
      recipients(): Recipient[] {
        return [
          Recipient.address("sara@example.com"),
          Recipient.principal(ADA),
          Recipient.address("SARA@example.com"),
        ];
      }
    }
    const deliveries = await prepareNotification(new InvitationNotification(), new OrderPaid([]));
    expect(deliveries.map((delivery) => delivery.recipient)).toEqual([
      Recipient.address("sara@example.com"),
      Recipient.principal(ADA),
    ]);
  });

  it("reads no data when there is no recipient", async () => {
    read.mockClear();
    await expect(
      prepareNotification(new OrderReceiptNotification(), new OrderPaid([])),
    ).resolves.toEqual([]);
    expect(read).not.toHaveBeenCalled();
  });

  it("uses the event as data and sends no mail without those methods", async () => {
    const event = new OrderPaid([BEN]);
    const [delivery] = await prepareNotification(new OrderShippedNotification(), event);
    expect(delivery?.data).toBe(event);
    expect(delivery?.mail).toBeNull();
    expect(delivery?.category).toBe(NotificationCategory.Activity);
  });

  it("refuses a class that is not a notification", async () => {
    const stranger = { recipients: () => [] } as unknown as NotificationInstance;
    await expect(prepareNotification(stranger, {})).rejects.toThrow(TypeError);
  });

  it("refuses a recipient that is not a Recipient", async () => {
    class Raw extends Notification({ category: NotificationCategory.Activity }) {
      recipients(): Recipient[] {
        return [{ principalId: ADA, scopeId: null } as Recipient];
      }
    }
    await expect(prepareNotification(new Raw(), {})).rejects.toThrow(TypeError);
  });

  it("refuses a mail without a subject", async () => {
    class Untitled extends Notification({ category: NotificationCategory.Activity }) {
      recipients(): Recipient[] {
        return [Recipient.principal(ADA)];
      }

      mail(_data: unknown, mail: MailMessage): MailMessage {
        return mail;
      }
    }
    await expect(prepareNotification(new Untitled(), {})).rejects.toThrow(/subject/);
  });
});
