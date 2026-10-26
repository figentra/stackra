# @stackra/notifications

Messages to people (ADR 0086, 0223 as amended by 0294). A notification is a class beside the model it concerns,
`resources/<model>/<name>.notification.ts`. It extends `Notification({ category })`. `recipients(event)` names who
hears it, and the type of that parameter is the trigger. An optional `data(event)` reads what every channel renders.
Each channel is a method the class declares. The mail body is a `.mail.tsx` class component of the same stem. Gen
compiles it at build time, and it is rendered to HTML and text. There is no template engine at run time (R-26).
Strings are i18n keys, never literals. The package was `@stackra/mail` (ADR 0294 decision 23).

**Tier:** `tier:lib` (`packages/communication/notifications`). Entries `.`, `./contracts`, `./node`, `./react` and
`./testing`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
`@stackra/i18n`, `@stackra/money`, `@stackra/assets`, `@stackra/errors`, `@stackra/integrations` (provider
Integrations and the provider resolver) and `@stackra/clients` (`./node` queues through it). React is an
optional peer, needed by `./node`, `./react` and `./testing` only.

## What is here

| Entry         | Symbol                                                                         | Use                                                                         |
| ------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `.`           | `Notification`                                                                 | the kind base: `Notification({ category })`, with `recipients(event)`       |
| `.`           | `NotificationCategory`                                                         | `transactional`, `activity`, `marketing`; case data `mutable`, `optIn`      |
| `.`           | `Recipient`                                                                    | `Recipient.principal(id)` or `Recipient.scope(scope)` (the scope's id only) |
| `.`           | `MailMessage` (type)                                                           | what `mail(data, mail)` returns: `mail.subject(key, values)`                |
| `.`           | `Notifier`                                                                     | the port gen's listener calls: `notify(notification, event)`                |
| `.`           | `MemoryNotifierDriver`                                                         | the `memory` driver: keeps deliveries for tests and dev                     |
| `.`           | `NotificationsConfig`, `NotificationsConfig$`, `NotificationsOptions`          | config key `notifications`; `driver` picks the `Notifier`                   |
| `.`           | `NotificationDelivery`, `NotificationOptions`, `NotifierDriverName`            | types                                                                       |
| `./contracts` | `MailTransport`, `OutboundMail` (type)                                         | the port a mail provider driver implements (`Driver(MailTransport)`)        |
| `./contracts` | `SmsTransport`, `OutboundSms` (type)                                           | the port an SMS provider driver implements                                  |
| `./contracts` | `InAppStore`, `InAppMessage`, `InAppEntry` (types)                             | a person's in-app inbox: `append`, `list`, `markRead`                       |
| `./contracts` | `ChatTransport`, `OutboundChatMessage` (type)                                  | the port a chat app driver implements (Slack, Teams, Telegram)              |
| `./node`      | `NotificationsNotifierDriver`                                                  | the `notifications` driver: queues rendered mail on the service             |
| `./node`      | `registerNotificationMails`, `NotificationMails` (type)                        | gen's registration of the mail bodies and lang loaders                      |
| `./react`     | `useMail`, `MailProps` (type)                                                  | what a `.mail.tsx` body imports                                             |
| `./testing`   | `renderMail`, `MemoryNotifier` (type)                                          | render a body in a locale; read what was sent                               |
| `./testing`   | `MailTransportFake`, `SmsTransportFake`, `InAppStoreFake`, `ChatTransportFake` | a double of each channel port                                               |

## A notification

```ts
import {
  type MailMessage,
  Notification,
  NotificationCategory,
  Recipient,
} from "@stackra/notifications";
import { I18n } from "#stackra/i18n";

export class OrderReceiptNotification extends Notification({
  category: NotificationCategory.Transactional, // preferences cannot mute it
}) {
  constructor(private readonly orders: OrderService) {
    super();
  }

  recipients(event: OrderPaid): Recipient[] {
    return [Recipient.principal(event.customerId)];
  }

  async data(event: OrderPaid): Promise<OrderReceiptData> {
    const row = await this.orders.findOneOrFail({ id: event.orderId });
    return OrderReceiptData.create({ order: this.orders.toView(row) });
  }

  mail({ order }: OrderReceiptData, mail: MailMessage): MailMessage {
    return mail.subject(I18n.orders.order_receipt.mail.subject, { id: order.id });
  }
}
```

Gen derives the key (`orders.order_receipt`), the trigger (`OrderPaid`), the channels (the methods present), the queue
(`notifications`) and the mail body (`order-receipt.mail.tsx`). Its listener calls `Notifier#notify` once per event id,
after commit. No recipient means no data read; a recipient named twice gets one delivery.

## A mail body

```tsx
import { Html, Text } from "@react-email/components";
import { type MailProps, useMail } from "@stackra/notifications/react";
import { Component } from "#stackra/ui";

export class OrderReceiptMail extends Component<MailProps<typeof OrderReceiptNotification>> {
  mail = useMail(); // t, money, asset, locale, dir for the recipient

  render() {
    const { t, money, locale, dir } = this.mail;
    const { order } = this.props; // OrderReceiptData
    return (
      <Html lang={locale} dir={dir}>
        <Text>{t(I18n.orders.order_receipt.mail.intro, { id: order.id })}</Text>
        <Text>{money(order.totals.totalMinor, order.totals.currency)}</Text>
      </Html>
    );
  }
}
```

`MailProps<typeof X>` is what `data(event)` resolves to, or the event when there is no `data` method. `useMail()` throws
outside a mail render.

## Delivery

`NotificationsConfig.driver` picks the `Notifier` driver; runway sets it per environment (ADR 0266): `memory` (in `.`)
keeps deliveries in the process, and `notifications` (`NotificationsNotifierDriver` in `./node`) queues each mail on the
notifications service. The notifications service owns delivery, preferences, the log and the inbox (ADR 0223 as amended
by 0270). Its `MailTransport` drivers (`memory`, `resend`) implement the port from `./contracts`; the SMS, in-app and
chat ports are there for the same split, and provider drivers stay with their integrations (ADR 0308).

The `notifications` driver renders the subject and the `.mail.tsx` body, then queues its target action through
`@stackra/clients` once per principal. The default target (`MESSAGES_NOTIFIER_TARGET`) is `messages.message.send@1`
(`{ mail, to: { principalId }, subject, html, text }`). A host whose service has another module or input passes its own
`NotifierTarget`: any action ref and a payload mapper that receives a `NotifierMessage` (template key, category,
principal, market from the bound `MarketContext`, the data and each rendered channel) and answers the action's input, or
`null` to skip that principal (ADR 0422):

````ts
export class CrmNotifierDriver extends NotificationsNotifierDriver {
  constructor(transport: ClientTransport, i18n: I18nConfig, assets: AssetLibrary, market: MarketContext) {
    super(transport, i18n, assets, {
      action: SEND_NOTICE_ACTION,
      payload: ({ template, principalId, category, market, channels }) => ({ template, principalId, category, market, mail: channels.mail }),
    }, market);
  }
}
``` It needs the body
of each notification and the member's lang loaders, which gen registers at startup:

```ts
import { registerNotificationMails } from "@stackra/notifications/node";
import { loaders } from "#stackra/i18n";

registerNotificationMails({
  bodies: [[OrderReceiptNotification, OrderReceiptMail]],
  catalogues: loaders,
});
````

Only the mail channel is rendered, only principals are addressed (a scope recipient is refused), and in the member's
default locale until identity answers a principal's language.

An in-app entry carries its product (`InAppMessage.product`), and `InAppStore.list(recipient, { product })` answers one
product's entries, for a per-product inbox and the ethical wall between products.

## Channels and providers

Products declare channels, never providers (ADR 0223 decision 2). The provider behind a channel is chosen per tenant
and Market by `@stackra/integrations`' `ProviderResolver` (ADR 0356): the tenant's own Connection first, then the
Market's platform Connection, both data.

| Channel port (`./contracts`)                                | Driver (`.`)                                           | Providers                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `MailTransport`                                             | `ConnectionMailTransportDriver`                        | `ResendConnection`, `SesConnection` (SigV4)                                        |
| `SmsTransport`                                              | `ConnectionSmsTransportDriver`                         | `UnifonicConnection`, `TaqnyatConnection`, `TwilioConnection`, `CequensConnection` |
| `WhatsAppTransport`                                         | `ConnectionWhatsAppTransportDriver`                    | `MetaWhatsAppConnection` (WhatsApp Cloud API: templates and text)                  |
| `PushTransport`                                             | `DevicePushTransportDriver`                            | `ExpoIntegration` (mobile) and Web Push (VAPID, `aes128gcm`)                       |
| voice (`VoiceGateway` of `@stackra/integrations/contracts`) | `ProviderResolver.resolve("voice", VOICE_CONNECTIONS)` | `TwilioConnection` (calls, TwiML, speech, handover, recording)                     |

- Every connection transport sends once per idempotency key through `SendLog` (keys and provider ids only).
- A device the push service reports gone is revoked through `PushTokenStore`; `receipts` reads Expo receipts.
- The VAPID keys and contact are platform secrets: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`,
  `WEB_PUSH_VAPID_SUBJECT`.

## Templates, quiet hours and escalation

| Symbol                                                | Use                                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `resolveTemplate(candidates, query)`                  | the cascade: locale chain first, then the nearest scope's override, then the code default |
| `TemplateVariant`, `TemplateOverrides`                | a restricted record takes only the content-free variant; no fallback to the full one      |
| `sendAfter({ category, mandatory, quietHours, now })` | the send time: now for a mandatory category or outside quiet hours, else the window's end |
| `dueEscalations(steps, state, now)`                   | the escalation steps due for an unacknowledged notification                               |

The mandatory categories, quiet hours, channel order and escalation steps are data (settings floors, settings, rule
sets), never defaults here.

## Testing

```ts
import { renderMail, type MemoryNotifier } from "@stackra/notifications/testing";

const out = await renderMail(OrderReceiptMail, data, { locale: "ar" }); // reads assets/lang/ar/*.json
expect(out.text).toContain("3 بنود");
expect(out.html).toContain('dir="rtl"');

const sent = (app.get(Notifier) as MemoryNotifier).sent(OrderReceiptNotification);
expect(sent[0]?.recipient).toEqual(Recipient.principal(order.customerId));
```

`renderMail` reads the member's own lang files from the working directory (the base language, then the regional
overlay) unless a test passes `messages`. `MailTransportFake`, `SmsTransportFake`, `InAppStoreFake` and
`ChatTransportFake` stand in for their ports.
