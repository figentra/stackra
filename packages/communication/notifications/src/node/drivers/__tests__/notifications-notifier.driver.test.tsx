/**
 * Stackra file contract:
 * Purpose: unit tests of `NotificationsNotifierDriver`: one queued `messages.message.send@1` per distinct principal
 *          with the snake_case template key and the rendered subject, HTML and text (catalogues merged along the
 *          fallback chain, assets resolved by the library); nothing queued without a mail channel or a recipient; and
 *          a TypeError, with nothing queued, for a scope recipient or a notification without a registered body; and a
 *          configured target: its own action key, the mapper given the template, category, market and channels, a
 *          `null` answer skipping the principal; config `notifications.target: delivery`: `delivery.message.send@1`
 *          with the message category, template values, market and mail, to a principal or a mail address; and a
 *          TypeError, with nothing queued, for a mail address the target cannot take.
 * Boundary: test only; a fake `ClientTransport` records the queued requests and a fake `AssetLibrary` answers URLs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0223; ADR 0260 (decision 4: queued calls); ADR 0422 (decision 1);
 *                     ADR 0422 (as amended by STA-1235).
 */
import type { AssetEntry, AssetLibrary } from "@stackra/assets";
import { remoteAction } from "@stackra/clients";
import { buildConfig } from "@stackra/config";
import { ClientTransport } from "@stackra/clients/contracts";
import type { ClientRequest } from "@stackra/clients/contracts";
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { I18nConfig, keys, Locale } from "@stackra/i18n";
import { MarketContext } from "@stackra/integrations/contracts";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { NotificationsConfig } from "#config/notifications.config";
import { Notification } from "#core/bases/notification.base";
import { NotificationCategory } from "#core/enums/notification-category.enum";
import { Notifier } from "#core/ports/notifier.port";
import type { MailMessage } from "#core/values/mail-message.value";
import { Recipient } from "#core/values/recipient.value";
import { NotificationsNotifierDriver } from "#node/drivers/notifications-notifier.driver";
import { registerNotificationMails } from "#node/functions/register-notification-mails.function";
import type { NotifierMessage } from "#node/types/notifier-message.type";
import type { NotifierTarget } from "#node/types/notifier-target.type";
import { useMail } from "#react/mail/use-mail";

const I18n = keys({ orders: { order_receipt: { mail: ["subject", "intro"] } } });
const ADA: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const BEN: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2w4";
const SCOPE: ScopeRef = { id: "scp_00000000000000000000000001", path: "root.acme" };
const LOGO = {
  key: "orders::public/logo.svg",
  file: "assets/public/logo.svg",
  overridable: true,
} as AssetEntry;

/** The trigger: who paid. */
class OrderPaid {
  readonly orderId = "ord_1";

  readonly recipients: readonly Recipient[];

  constructor(recipients: readonly Recipient[]) {
    this.recipients = recipients;
  }
}

class OrderReceiptNotification extends Notification({
  category: NotificationCategory.Transactional,
}) {
  recipients(event: OrderPaid): Recipient[] {
    return [...event.recipients];
  }

  data(event: OrderPaid): { readonly id: string } {
    return { id: event.orderId };
  }

  mail({ id }: { readonly id: string }, mail: MailMessage): MailMessage {
    return mail.subject(I18n.orders.order_receipt.mail.subject, { id });
  }
}

/** An invitation: a principal and an address with no account, in the delivery service's `security` category. */
class InvitationNotification extends Notification({
  category: NotificationCategory.Transactional,
  messageCategory: "security",
}) {
  recipients(event: OrderPaid): Recipient[] {
    return [...event.recipients];
  }

  data(event: OrderPaid): { readonly id: string; readonly seats: number; readonly meta: object } {
    return { id: event.orderId, seats: 3, meta: {} };
  }
}

/** Mail-less: no channel the driver sends. */
class OrderShippedNotification extends Notification({ category: NotificationCategory.Activity }) {
  recipients(event: OrderPaid): Recipient[] {
    return [...event.recipients];
  }
}

/** Has a mail channel but no registered body. */
class OrderLateNotification extends Notification({ category: NotificationCategory.Activity }) {
  recipients(event: OrderPaid): Recipient[] {
    return [...event.recipients];
  }

  mail(_data: unknown, mail: MailMessage): MailMessage {
    return mail.subject(I18n.orders.order_receipt.mail.subject, { id: "x" });
  }
}

/** The receipt body as gen compiles it. */
function OrderReceiptMail({ id }: { readonly id: string }) {
  const { t, asset } = useMail();
  return (
    <p>
      <img src={asset(LOGO)} alt="" />
      {t(I18n.orders.order_receipt.mail.intro, { id })}
    </p>
  );
}

registerNotificationMails({
  bodies: [[OrderReceiptNotification, OrderReceiptMail]],
  catalogues: {
    orders: {
      ar: async () => ({
        default: { order_receipt: { mail: { subject: "إيصال {id}", intro: "شكرًا {id}" } } },
      }),
      "ar-SA": async () => ({ default: { order_receipt: { mail: { subject: "إيصالك {id}" } } } }),
    },
  },
});

/** Records every queued request; a direct call is never made. */
class RecordingClientTransport extends ClientTransport {
  readonly queued: ClientRequest[] = [];

  send(): Promise<unknown> {
    return Promise.reject(new Error("the driver only queues"));
  }

  queue(request: ClientRequest): Promise<void> {
    this.queued.push(request);
    return Promise.resolve();
  }
}

/** Saudi Arabic, falling back to Arabic. */
class SaudiI18nConfig extends I18nConfig {
  override defaultLocale: Locale = Locale.ArSa;

  override fallbacks: Record<string, Locale[]> = { "ar-SA": [Locale.Ar] };
}

/** Saudi Arabia. */
class SaudiMarketContext extends MarketContext {
  market(): string {
    return "sa";
  }
}

/** Another service's action, which takes the category, the market and any channel. */
const SEND_NOTICE_ACTION = remoteAction("crm.notice.send@1", {
  input: z.object({
    template: z.string(),
    principalId: z.string(),
    category: z.string(),
    market: z.string().optional(),
    subject: z.string().optional(),
  }),
  output: z.object({}),
});

/** A driver over a recording transport and a CDN asset library. */
function driver(
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the test's target is its own action's
  target?: NotifierTarget<any>,
  config?: NotificationsConfig,
): { notifier: NotificationsNotifierDriver; transport: RecordingClientTransport } {
  const transport = new RecordingClientTransport();
  const assets = {
    resolve: (entry: AssetEntry) => ({ ...entry, url: `https://cdn.example/${entry.file}` }),
  };
  const notifier = new NotificationsNotifierDriver(
    transport,
    new SaudiI18nConfig(),
    assets as unknown as AssetLibrary,
    target,
    new SaudiMarketContext(),
    config,
  );
  return { notifier, transport };
}

describe("NotificationsNotifierDriver", () => {
  it("is the Notifier port", () => {
    expect(driver().notifier).toBeInstanceOf(Notifier);
  });

  it("queues one rendered send per distinct principal", async () => {
    const { notifier, transport } = driver();
    const ada = Recipient.principal(ADA);
    await notifier.notify(
      new OrderReceiptNotification(),
      new OrderPaid([ada, Recipient.principal(BEN), ada]),
    );
    expect(transport.queued.map((request) => request.key)).toEqual([
      "messages.message.send@1",
      "messages.message.send@1",
    ]);
    const [first, second] = transport.queued.map(
      (request) => request.input as Record<string, unknown>,
    );
    expect(first).toMatchObject({ mail: "order_receipt", to: { principalId: ADA } });
    expect(second).toMatchObject({ to: { principalId: BEN } });
    expect(first?.["subject"]).toBe("إيصالك ord_1");
    expect(first?.["html"]).toContain("شكرًا ord_1");
    expect(first?.["html"]).toContain("https://cdn.example/assets/public/logo.svg");
    expect(first?.["text"]).toContain("شكرًا ord_1");
  });

  it("queues nothing without a mail channel or a recipient", async () => {
    const { notifier, transport } = driver();
    await notifier.notify(
      new OrderShippedNotification(),
      new OrderPaid([Recipient.principal(ADA)]),
    );
    await notifier.notify(new OrderReceiptNotification(), new OrderPaid([]));
    expect(transport.queued).toEqual([]);
  });

  it("refuses a scope recipient before queueing anything", async () => {
    const { notifier, transport } = driver();
    const event = new OrderPaid([Recipient.principal(ADA), Recipient.scope(SCOPE)]);
    await expect(notifier.notify(new OrderReceiptNotification(), event)).rejects.toThrow(
      /scope recipient/,
    );
    expect(transport.queued).toEqual([]);
  });

  it("refuses a mail channel with no registered body", async () => {
    const { notifier, transport } = driver();
    await expect(
      notifier.notify(new OrderLateNotification(), new OrderPaid([Recipient.principal(ADA)])),
    ).rejects.toThrow(/no mail body/);
    expect(transport.queued).toEqual([]);
  });

  it("queues the configured target's action with the mapper's payload", async () => {
    const seen: NotifierMessage[] = [];
    const { notifier, transport } = driver({
      action: SEND_NOTICE_ACTION,
      payload: (message: NotifierMessage) => {
        seen.push(message);
        return message.principalId === BEN
          ? null
          : {
              template: message.template,
              principalId: message.principalId,
              category: message.category,
              market: message.market,
              subject: message.channels.mail?.subject,
            };
      },
    });
    await notifier.notify(
      new OrderReceiptNotification(),
      new OrderPaid([Recipient.principal(ADA), Recipient.principal(BEN)]),
    );
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({
      template: "order_receipt",
      category: NotificationCategory.Transactional,
      market: "sa",
      data: { id: "ord_1" },
    });
    expect(transport.queued.map((request) => request.key)).toEqual(["crm.notice.send@1"]);
    expect(transport.queued[0]?.input).toEqual({
      template: "order_receipt",
      principalId: ADA,
      category: "transactional",
      market: "sa",
      subject: "إيصالك ord_1",
    });
  });

  it("hands a mail-less notification to the target with no channel", async () => {
    const { notifier, transport } = driver({
      action: SEND_NOTICE_ACTION,
      payload: ({ template, principalId, category, channels }: NotifierMessage) => ({
        template,
        principalId,
        category: Object.keys(channels).length === 0 ? category : "unexpected",
      }),
    });
    await notifier.notify(
      new OrderShippedNotification(),
      new OrderPaid([Recipient.principal(ADA)]),
    );
    expect(transport.queued[0]?.input).toEqual({
      template: "order_shipped",
      principalId: ADA,
      category: "activity",
    });
  });

  it("queues delivery.message.send@1 when config names the delivery target", async () => {
    const config = buildConfig(NotificationsConfig, { values: { target: "delivery" } });
    const { notifier, transport } = driver(undefined, config);
    await notifier.notify(
      new InvitationNotification(),
      new OrderPaid([Recipient.principal(ADA), Recipient.address("Sara@Example.com")]),
    );
    expect(transport.queued.map((request) => request.key)).toEqual([
      "delivery.message.send@1",
      "delivery.message.send@1",
    ]);
    const common = {
      notification: "invitation",
      category: "security",
      data: { id: "ord_1", seats: 3 },
      mail: null,
      market: "sa",
    };
    expect(transport.queued[0]?.input).toEqual({ ...common, to: { principalId: ADA } });
    expect(transport.queued[1]?.input).toEqual({ ...common, to: { email: "sara@example.com" } });
  });

  it("sends the rendered mail and the category code on the delivery target", async () => {
    const config = buildConfig(NotificationsConfig, { values: { target: "delivery" } });
    const { notifier, transport } = driver(undefined, config);
    await notifier.notify(
      new OrderReceiptNotification(),
      new OrderPaid([Recipient.principal(ADA)]),
    );
    const input = transport.queued[0]?.input as Record<string, unknown>;
    expect(input).toMatchObject({ notification: "order_receipt", category: "transactional" });
    expect(input["mail"]).toMatchObject({ subject: "إيصالك ord_1" });
  });

  it("refuses a mail address the target cannot take before queueing anything", async () => {
    const { notifier, transport } = driver();
    const event = new OrderPaid([Recipient.principal(ADA), Recipient.address("sara@example.com")]);
    await expect(notifier.notify(new OrderShippedNotification(), event)).rejects.toThrow(
      /principals only/,
    );
    expect(transport.queued).toEqual([]);
  });
});
