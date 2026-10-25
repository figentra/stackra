/**
 * Stackra file contract:
 * Purpose: the `notifications` driver of the `Notifier` port: prepares each notification, renders its mail (subject and
 *          `.mail.tsx` body) and queues one `messages.message.send@1` per recipient on the notifications service, which
 *          resolves the address, applies preferences and delivers.
 * Boundary: the mail channel only: a notification without a `mail` method queues nothing. The action's input is the
 *           mail (`mail`, the notification's snake_case stem, the recipient, subject, HTML and text); it takes no
 *           other channel and no category. A recipient is a principal: a scope recipient is refused before anything
 *           is queued, because the action addresses one principal. The body comes from `registerNotificationMails`;
 *           the subject and body are rendered once per notification, in the default locale. A redelivered queued call
 *           is harmless: the action derives its Idempotency-Key from the input.
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294 and ADR 0270); ADR 0260 (decision 4: queued calls); ADR 0266
 *                     (decision 5: config picks the driver); ADR 0134 (no address leaves the producer).
 */
import type { AssetLibrary } from "@stackra/assets";
import type { ClientTransport } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import { formatMessage, mergeCatalogues, NumberingSystem } from "@stackra/i18n";
import type { I18nConfig, I18nKey, Locale } from "@stackra/i18n";

import type { Notification } from "#core/bases/notification.base";
import { prepareNotification } from "#core/functions/prepare-notification.function";
import { Notifier } from "#core/ports/notifier.port";
import { NotificationsClient } from "#node/clients/notifications.client";
import { NOTIFICATION_MAILS } from "#node/constants/notification-mails.constant";
import type { MailRenderOptions } from "#react/mail/mail-render-options.type";
import { renderMailBody } from "#react/mail/render-mail-body.function";

/** The catalogues of one locale, by namespace. */
type Messages = MailRenderOptions["messages"];

/**
 * Queues rendered mail on the notifications service.
 *
 * @example
 * // gen's wiring, when `notifications.driver` is `notifications`
 * notifications: () => import("@stackra/notifications/node").then((m) => m.NotificationsNotifierDriver),
 */
export class NotificationsNotifierDriver extends Driver(Notifier) {
  /** The notifications service. */
  private readonly client: NotificationsClient;

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
   */
  constructor(transport: ClientTransport, i18n: I18nConfig, assets: AssetLibrary) {
    super();
    this.client = new NotificationsClient(transport);
    this.i18n = i18n;
    this.assets = assets;
  }

  /**
   * Queues `notification`'s mail for `event` to each recipient.
   *
   * @throws TypeError when a recipient is a scope, or the notification has a `mail` method but no registered body.
   */
  async notify(notification: Notification, event: object): Promise<void> {
    const deliveries = (await prepareNotification(notification, event)).filter(
      (delivery) => delivery.mail !== null,
    );
    const [first] = deliveries;
    if (first === undefined || first.mail === null) return;
    const name = notification.constructor.name;
    const principals = deliveries.map(({ recipient }) => {
      if (recipient.principalId === null)
        throw new TypeError(
          `${name} names a scope recipient; the notifications driver addresses principals only`,
        );
      return recipient.principalId;
    });
    const body = NOTIFICATION_MAILS.bodies.get(notification.constructor);
    if (body === undefined)
      throw new TypeError(`${name} has no mail body: run stackra gen to register its .mail.tsx`);

    // shortcut: every recipient gets the default locale; render per recipient once identity answers a principal's
    // language (the per-recipient language item of the notifications row).
    const locale = this.i18n.defaultLocale;
    const messages = await this.messagesOf(locale);
    const subject = formatMessage(
      messages,
      first.mail.subjectKey as I18nKey, // prepareNotification refuses a mail without a subject
      first.mail.subjectValues,
      this.i18n.numerals === NumberingSystem.User ? locale : `${locale}-u-nu-${this.i18n.numerals}`,
    );
    const { html, text } = renderMailBody(body, first.data, {
      locale,
      messages,
      i18n: this.i18n,
      asset: (entry) => this.assets.resolve(entry).url,
    });
    const mail = mailKeyOf(name);
    for (const principalId of principals)
      await this.client.message.send.queue({ mail, to: { principalId }, subject, html, text });
  }

  /** The catalogues of `locale`, merged along its fallback chain (the most specific wins). */
  private messagesOf(locale: Locale): Promise<Messages> {
    let loaded = this.messages.get(locale);
    if (loaded === undefined) {
      const chain = [...new Set([...(this.i18n.fallbacks[locale] ?? [])].reverse().concat(locale))];
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

/** The service's template key of a notification class, its snake_case stem (`order_receipt`). */
function mailKeyOf(name: string): string {
  return name
    .replace(/Notification$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}
