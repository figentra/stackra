/**
 * Stackra file contract:
 * Purpose: the `notifications` driver of the `Notifier` port: prepares each notification, renders its mail (subject and
 *          `.mail.tsx` body) and queues one call of its target action per recipient. The target is configurable: any
 *          service's action and a payload mapper that receives the template key, the category, the principal, the
 *          market and each rendered channel. A host's subclass's `target` wins; otherwise config `notifications.target` picks
 *          the built-in one: `messages` (`messages.message.send@1` with the mail, the default) or `delivery`
 *          (`delivery.message.send@1` with the category code, data, market and mail).
 * Boundary: a recipient is a principal or, when the target has an `addressPayload`, a mail address with no account:
 *           a scope recipient, or an address the target cannot take, is refused before anything is queued, because
 *           the target addresses one person. A message the mapper answers `null` for is skipped. The mail body comes
 *           from `registerNotificationMails`; the subject and body are rendered once per notification, in the default
 *           locale. The market is the bound `MarketContext`'s, read once per notification. A redelivered queued call
 *           is harmless: the target action derives its Idempotency-Key from the input. The constructor takes class
 *           tokens only (ADR 0294 rule 17), so a host target is a member, not an argument.
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294 and ADR 0270); ADR 0260 (decision 4: queued calls); ADR 0266
 *                     (decision 5: config picks the driver); ADR 0134 (no address leaves the producer); ADR 0422
 *                     (decision 1, as amended by STA-1235).
 */
import type { AssetLibrary } from "@stackra/assets";
import type { ClientTransport } from "@stackra/clients/contracts";
import { Driver, kindOf } from "@stackra/container";
import { formatMessage, mergeCatalogues, NumberingSystem } from "@stackra/i18n";
import type { I18nConfig, I18nKey, Locale } from "@stackra/i18n";
import type { MarketContext } from "@stackra/integrations/contracts";

import type { NotificationsConfig } from "#config/notifications.config";
import type { Notification } from "#core/bases/notification.base";
import { prepareNotification } from "#core/functions/prepare-notification.function";
import { Notifier } from "#core/ports/notifier.port";
import type { NotificationDelivery } from "#core/types/notification-delivery.type";
import { NotificationsClient } from "#node/clients/notifications.client";
import { DELIVERY_NOTIFIER_TARGET } from "#node/constants/delivery-notifier-target.constant";
import { MESSAGES_NOTIFIER_TARGET } from "#node/constants/messages-notifier-target.constant";
import { NOTIFICATION_MAILS } from "#node/constants/notification-mails.constant";
import type { NotifierAddressMessage } from "#node/types/notifier-address-message.type";
import type { NotifierMessage } from "#node/types/notifier-message.type";
import type { NotifierTarget } from "#node/types/notifier-target.type";
import type { MailRenderOptions } from "#react/mail/mail-render-options.type";
import { renderMailBody } from "#react/mail/render-mail-body.function";

/** The catalogues of one locale, by namespace. */
type Messages = MailRenderOptions["messages"];

/** The built-in targets config `notifications.target` names. */
const TARGETS = { messages: MESSAGES_NOTIFIER_TARGET, delivery: DELIVERY_NOTIFIER_TARGET } as const;

/**
 * Queues rendered notifications on the target service.
 *
 * @example
 * // gen's wiring, when `notifications.driver` is `notifications`
 * notifications: () => import("@stackra/notifications/node").then((m) => m.NotificationsNotifierDriver),
 *
 * // a host whose service is not `messages`
 * export class CrmNotifierDriver extends NotificationsNotifierDriver {
 *   protected override readonly target = { action: SEND_NOTICE_ACTION, payload: toNotice };
 * }
 */
export class NotificationsNotifierDriver extends Driver(Notifier) {
  /**
   * The action queued per recipient and its payload mappers; a host's subclass overrides it, else config
   * `notifications.target` names the built-in one (`messages` when absent).
   */
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: each target's input is its own action's
  protected readonly target: NotifierTarget<any> | undefined = undefined;

  /** The target service's client. */
  private readonly client: NotificationsClient;

  /** The notifications configuration; its `target` names the built-in target. */
  private readonly config: NotificationsConfig | undefined;

  /** The running call's Market, when the host binds one. */
  private readonly market: MarketContext | undefined;

  /** The member's locales, fallbacks, right-to-left set and digits. */
  private readonly i18n: I18nConfig;

  /** Resolves the public URL of a module asset a body shows. */
  private readonly assets: AssetLibrary;

  /** The merged catalogues by locale, loaded once. */
  private readonly messages = new Map<Locale, Promise<Messages>>();

  /**
   * @param transport - the transport topology picked for calls to the notifications service.
   * @param i18n - the member's i18n configuration.
   * @param assets - the published assets.
   * @param market - the running call's Market, passed to the mapper; none when the host binds no `MarketContext`.
   * @param config - the notifications configuration; its `target` names the built-in target (`messages` when
   *                 absent).
   */
  constructor(
    transport: ClientTransport,
    i18n: I18nConfig,
    assets: AssetLibrary,
    market?: MarketContext,
    config?: NotificationsConfig,
  ) {
    super();
    this.client = new NotificationsClient(transport);
    this.config = config;
    this.i18n = i18n;
    this.assets = assets;
    this.market = market;
  }

  /**
   * Queues `notification` for `event` to each recipient, through the target.
   *
   * @throws TypeError when a recipient is a scope, or a mail address the target cannot take, or the notification has
   *         a `mail` method but no registered body.
   * @throws ClientError when a mapped payload breaks the target action's input; the calls before it are queued.
   */
  async notify(notification: Notification, event: object): Promise<void> {
    // oxlint-disable-next-line typescript/no-explicit-any -- reason: each target's input is its own action's
    const chosen: NotifierTarget<any> = this.target ?? TARGETS[this.config?.target ?? "messages"];
    const deliveries = await prepareNotification(notification, event);
    const [first] = deliveries;
    if (first === undefined) return;
    const name = notification.constructor.name;
    const recipients = deliveries.map(({ recipient }) => {
      if (recipient.principalId !== null) return { principalId: recipient.principalId };
      if (recipient.email === null)
        throw new TypeError(
          `${name} names a scope recipient; the notifications driver addresses one person at a time`,
        );
      if (chosen.addressPayload === undefined)
        throw new TypeError(
          `${name} names a mail address; the configured target takes principals only (use notifications.target: delivery)`,
        );
      return { email: recipient.email };
    });
    const mail = first.mail === null ? undefined : await this.renderMail(name, notification, first);
    const messageCategory = kindOf(notification.constructor)?.options["messageCategory"] as
      | string
      | undefined;
    const base = {
      template: templateKeyOf(name),
      category: first.category,
      ...(messageCategory === undefined ? {} : { messageCategory }),
      market: this.market?.market(),
      data: first.data,
      channels: mail === undefined ? {} : { mail },
    };
    for (const to of recipients) {
      const input =
        "email" in to
          ? chosen.addressPayload?.({ ...base, email: to.email } satisfies NotifierAddressMessage)
          : chosen.payload({ ...base, principalId: to.principalId } satisfies NotifierMessage);
      if (input !== null && input !== undefined) await this.client.send(chosen.action).queue(input);
    }
  }

  /**
   * The subject, HTML and text of `delivery`'s mail, in the default locale.
   *
   * @throws TypeError when the notification has no registered body.
   */
  private async renderMail(
    name: string,
    notification: Notification,
    delivery: NotificationDelivery,
  ): Promise<{ readonly subject: string; readonly html: string; readonly text: string }> {
    const body = NOTIFICATION_MAILS.bodies.get(notification.constructor);
    if (body === undefined || delivery.mail === null)
      throw new TypeError(`${name} has no mail body: run stackra gen to register its .mail.tsx`);
    // shortcut: every recipient gets the default locale; render per recipient once identity answers a principal's
    // language (the per-recipient language item of the notifications row).
    const locale = this.i18n.defaultLocale;
    const messages = await this.messagesOf(locale);
    const subject = formatMessage(
      messages,
      delivery.mail.subjectKey as I18nKey, // prepareNotification refuses a mail without a subject
      delivery.mail.subjectValues,
      this.i18n.numerals === NumberingSystem.User ? locale : `${locale}-u-nu-${this.i18n.numerals}`,
    );
    const { html, text } = renderMailBody(body, delivery.data, {
      locale,
      messages,
      i18n: this.i18n,
      asset: (entry) => this.assets.resolve(entry).url,
    });
    return { subject, html, text };
  }

  /** The catalogues of `locale`, merged along its fallback chain (the most specific wins). */
  private messagesOf(locale: Locale): Promise<Messages> {
    let loaded = this.messages.get(locale);
    if (loaded === undefined) {
      const fallbacks = [...(this.i18n.fallbacks[locale] ?? [])];
      fallbacks.reverse();
      const chain = [...new Set([...fallbacks, locale])];
      loaded = Promise.all(
        [...NOTIFICATION_MAILS.catalogues].map(async ([namespace, loaders]) => {
          const catalogues = await Promise.all(
            chain.flatMap((tag) => {
              const load = loaders[tag];
              return load === undefined ? [] : [load().then((module) => module.default)];
            }),
          );
          return [namespace, mergeCatalogues(catalogues)] as const;
        }),
      ).then((entries) => Object.fromEntries(entries) as Messages);
      this.messages.set(locale, loaded);
    }
    return loaded;
  }
}

/** The target's template key of a notification class, its snake_case stem (`order_receipt`). */
function templateKeyOf(name: string): string {
  return name
    .replace(/Notification$/, "")
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}
