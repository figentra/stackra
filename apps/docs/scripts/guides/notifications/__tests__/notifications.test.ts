/**
 * Stackra file contract:
 * Purpose: the tests of the "Notifications" guide's examples: on `TicketAnswered` the notification addresses the
 *          ticket's customer once, reads the ticket once, and gives the mail its subject key and values, in the
 *          `activity` category; no recipient reads no data; a customer who mutes the category's mail is no longer
 *          allowed it, while a transactional mail cannot be muted; the one-click unsubscribe link carries the RFC 8058
 *          headers for a mutable category only, verifies back to the customer and category, and a forged token
 *          verifies to nothing.
 * Boundary: test only; the notifier is `MemoryNotifierDriver` (the `memory` driver, which prepares a notification as a
 *           sending driver does and keeps the deliveries), the preferences `MemoryPreferenceStoreDriver`, the ticket
 *           store a double and `support.schemas.ts` gen's event schema. The unsubscribe key is a fixed test value, never a real secret.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0086; ADR 0223 as amended by ADR 0294; STA-2852.
 */
import "./support.schemas";

import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import type { PublicId } from "@stackra/contracts";
import {
  canMute,
  listUnsubscribeHeaders,
  MemoryNotifierDriver,
  MemoryPreferenceStoreDriver,
  NotificationCategory,
  NotificationsConfig,
  Recipient,
  unsubscribeLink,
  verifyUnsubscribeToken,
} from "@stackra/notifications";
import { NotificationChannel } from "@stackra/notifications/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TicketAnswered } from "../ticket-answered.event";
import { TicketAnsweredNotification } from "../ticket-answered.notification";
import { Ticket } from "../ticket.model";
import type { TicketService } from "../ticket.service";

const ADA = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId<"usr">;
const TICKET = "tkt_01j9z3k4m5n6p7q8r9s0t1v2t1" as PublicId<"tkt">;

/** A fixed key for the test's unsubscribe tokens; a deployment's comes from its secret. */
const TEST_UNSUBSCRIBE_KEY = "guide-test-unsubscribe-key";

/** A ticket store holding Ada's ticket, counting its reads. */
function ticketDesk() {
  const reads: string[] = [];
  const ticket = Object.assign(new Ticket(), {
    id: TICKET,
    customerId: ADA,
    subject: "Invoice shows the wrong VAT",
  });
  const service = {
    get: async (id: string) => {
      reads.push(id);
      return ticket;
    },
  } as unknown as TicketService;
  return { service, reads };
}

/** The notifications configuration with the unsubscribe endpoint, its key read from the (test) secret store. */
const config = buildConfig(NotificationsConfig, {
  values: { unsubscribeUrl: "https://support.example.com/unsubscribe" },
  secrets: new MemorySecretStoreDriver().set("NOTIFICATIONS_UNSUBSCRIBE_KEY", TEST_UNSUBSCRIBE_KEY),
});

describe("Notifications guide", () => {
  it("addresses the customer once with the ticket's subject", async () => {
    const desk = ticketDesk();
    // #region notify
    const notifier = new MemoryNotifierDriver();
    const answered = TicketAnswered.create({ ticketId: TICKET, customerId: ADA });

    await notifier.notify(new TicketAnsweredNotification(desk.service), answered);

    const [delivery, ...others] = notifier.sent(TicketAnsweredNotification);
    expect(others).toEqual([]);
    expect(delivery?.recipient).toEqual(Recipient.principal(ADA));
    expect(delivery?.category).toBe(NotificationCategory.Activity);
    expect(delivery?.mail?.subjectKey).toBe("support::ticket_answered.mail.subject");
    expect(delivery?.mail?.subjectValues).toEqual({ subject: "Invoice shows the wrong VAT" });
    // #endregion notify
    expect(desk.reads).toEqual([TICKET]);
  });

  it("reads no data when nobody is to hear it", async () => {
    const desk = ticketDesk();
    const notifier = new MemoryNotifierDriver();
    const silent = new TicketAnsweredNotification(desk.service);
    silent.recipients = () => [];
    await notifier.notify(silent, TicketAnswered.create({ ticketId: TICKET, customerId: ADA }));
    expect(notifier.sent()).toEqual([]);
    expect(desk.reads).toEqual([]);
  });

  it("lets the customer mute the activity mail but never a transactional one", async () => {
    // #region preferences
    const preferences = new MemoryPreferenceStoreDriver(config);
    const activity = NotificationCategory.Activity;

    expect(await preferences.allows(ADA, activity, NotificationChannel.Mail)).toBe(true);
    await preferences.set(ADA, activity, NotificationChannel.Mail, false);
    expect(await preferences.allows(ADA, activity, NotificationChannel.Mail)).toBe(false);
    expect(await preferences.allows(ADA, activity, NotificationChannel.Push)).toBe(true);

    const transactional = NotificationCategory.Transactional;
    expect(canMute(transactional, config.mandatoryCategories)).toBe(false);
    expect(await preferences.set(ADA, transactional, NotificationChannel.Mail, false)).toBe(false);
    expect(await preferences.allows(ADA, transactional, NotificationChannel.Mail)).toBe(true);
    // #endregion preferences
  });

  it("signs a one-click unsubscribe link that verifies back to the customer and category", async () => {
    // #region unsubscribe
    const link = await unsubscribeLink({
      recipient: ADA,
      category: NotificationCategory.Activity,
      key: config.unsubscribeKey,
      url: config.unsubscribeUrl,
    });
    expect(listUnsubscribeHeaders(NotificationCategory.Activity, [], link)).toEqual({
      "List-Unsubscribe": `<${link}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
    expect(listUnsubscribeHeaders(NotificationCategory.Transactional, [], link)).toEqual({});

    const token = new URL(link).searchParams.get("token") ?? "";
    expect(await verifyUnsubscribeToken(token, config.unsubscribeKey)).toEqual({
      recipient: ADA,
      category: NotificationCategory.Activity,
    });
    expect(await verifyUnsubscribeToken(`${token}x`, config.unsubscribeKey)).toBeUndefined();
    // #endregion unsubscribe
  });
});
