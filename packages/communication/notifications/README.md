# @stackra/notifications

<!--
Stackra file contract:
Purpose: the package's reader guide: notifications, channels and providers, inbound WhatsApp, templates and testing.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0086; ADR 0223; ADR 0294; ADR 0356; ADR 0448; STA-964; stackra-207 (STA-1360).
-->

Messages to people (ADR 0086, 0223 as amended by 0294). A notification is a class beside the model it concerns,
`resources/<model>/<name>.notification.ts`. It extends `Notification({ category })`. `recipients(event)` names who
hears it, and the type of that parameter is the trigger. An optional `data(event)` reads what every channel renders.
Each channel is a method the class declares. The mail body is a `.mail.tsx` class component of the same stem. Gen
compiles it at build time, and it is rendered to HTML and text. There is no template engine at run time (R-26).
Strings are i18n keys, never literals. The package was `@stackra/mail` (ADR 0294 decision 23).

**Tier:** `tier:lib` (`packages/communication/notifications`). Entries `.`, `./contracts`, `./node`, `./react` and
`./testing`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
`@stackra/i18n`, `@stackra/money`, `@stackra/assets`, `@stackra/errors`, `@stackra/events` (the `DeliveryRecorded`
event and the `EventOutbox` it is written to), `@stackra/integrations` (provider Integrations and the provider resolver) and `@stackra/clients` (`./node` queues through it). React is an
optional peer, needed by `./node`, `./react` and `./testing` only.

## What is here

| Entry         | Symbol                                                                         | Use                                                                       |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `.`           | `Notification`                                                                 | the kind base: `Notification({ category })`, with `recipients(event)`     |
| `.`           | `NotificationCategory`                                                         | `transactional`, `activity`, `marketing`; case data `mutable`, `optIn`    |
| `.`           | `Recipient`                                                                    | `Recipient.principal(id)`, `.scope(scope)`, `.address(email)`             |
| `.`           | `MailMessage` (type)                                                           | what `mail(data, mail)` returns: `mail.subject(key, values)`              |
| `.`           | `Notifier`                                                                     | the port gen's listener calls: `notify(notification, event)`              |
| `.`           | `MemoryNotifierDriver`                                                         | the `memory` driver: keeps deliveries for tests and dev                   |
| `.`           | `NotificationsConfig`, `NotificationsConfig$`, `NotificationsOptions`          | key `notifications`: `driver`, `target`, `mandatoryCategories`            |
| `.`           | `NotificationDelivery`, `NotificationOptions`, `NotifierDriverName`            | types                                                                     |
| `./contracts` | `MailTransport`, `OutboundMail` (type)                                         | the port a mail provider driver implements (`Driver(MailTransport)`)      |
| `./contracts` | `SmsTransport`, `OutboundSms` (type)                                           | the port an SMS provider driver implements                                |
| `./contracts` | `InAppStore`, `InAppMessage`, `InAppEntry` (types)                             | a person's in-app inbox: `append`, `list`, `markRead`                     |
| `./contracts` | `ChatTransport`, `OutboundChatMessage` (type)                                  | the port a chat app driver implements (Slack, Teams, Telegram)            |
| `./contracts` | `WhatsAppInbound`, `InboundWhatsApp`, `InboundWhatsAppCartItem` (types)        | reads customer texts, native carts and replies from a webhook             |
| `.`           | `MemoryWhatsAppInboundDriver`, `MetaWhatsAppInboundDriver`                     | the `memory` and `meta` (Cloud API) drivers of `WhatsAppInbound`          |
| `.`           | `META_WHATSAPP_WEBHOOK_SIGNATURE`                                              | Meta's `hmac` signature recipe for the Integration's `webhooks`           |
| `./contracts` | `NotificationDeliveryEvent` (type)                                             | one delivery outcome: `deliveryId`, `channel`, `provider`, `status`, `at` |
| `.`           | `DeliveryRecorded`                                                             | the `notifications.delivery.recorded.v1` integration event of an outcome  |
| `./node`      | `NotificationsNotifierDriver`                                                  | the `notifications` driver: queues rendered mail on the service           |
| `./node`      | `MESSAGES_NOTIFIER_TARGET`, `DELIVERY_NOTIFIER_TARGET`                         | the built-in targets config `notifications.target` names                  |
| `./node`      | `NotifierTarget`, `NotifierMessage`, `NotifierAddressMessage` (types)          | what a host's own target is written with                                  |
| `./node`      | `registerNotificationMails`, `NotificationMails` (type)                        | gen's registration of the mail bodies and lang loaders                    |
| `./react`     | `useMail`, `MailProps` (type)                                                  | what a `.mail.tsx` body imports                                           |
| `./testing`   | `renderMail`, `MemoryNotifier` (type)                                          | render a body in a locale; read what was sent                             |
| `./testing`   | `MailTransportFake`, `SmsTransportFake`, `InAppStoreFake`, `ChatTransportFake` | a double of each channel port                                             |

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

```ts
export class CrmNotifierDriver extends NotificationsNotifierDriver {
  constructor(
    transport: ClientTransport,
    i18n: I18nConfig,
    assets: AssetLibrary,
    market: MarketContext,
  ) {
    super(
      transport,
      i18n,
      assets,
      {
        action: SEND_NOTICE_ACTION,
        payload: ({ template, principalId, category, market, channels }) => ({
          template,
          principalId,
          category,
          market,
          mail: channels.mail,
        }),
      },
      market,
    );
  }
}
```

Without a host target, config `notifications.target` picks a built-in one (ADR 0422 as amended): `messages` (the
default above) or `delivery` (`DELIVERY_NOTIFIER_TARGET`), the OS notifications service's `delivery.message.send@1`:
`{ notification, category, to, data, mail, market }`. Its `category` is the notification's `messageCategory` (the
service's own code, `security`) or else its `NotificationCategory`; `data` is the data's top-level strings and numbers;
`mail` is the rendered mail or `null`, since the service picks the channels from the category's chain.

```ts
export class InvitationNotification extends Notification({
  category: NotificationCategory.Transactional,
  messageCategory: "security",
}) {
  recipients(event: InvitationCreated): Recipient[] {
    return [Recipient.address(event.email)]; // a person with no account yet
  }
}
```

`Recipient.address(email)` is for a person with no principal yet (an invitation, a partner lead); the driver hands it to
the target's `addressPayload` as a `NotifierAddressMessage` (`email` in place of `principalId`), and refuses it before
anything is queued when the target has none (`MESSAGES_NOTIFIER_TARGET` takes principals only). Use
`Recipient.principal(id)` whenever the person has an account, so the address stays with identity (ADR 0134).

The `notifications` driver needs the body of each notification and the member's lang loaders, which gen registers at
startup:

```ts
import { registerNotificationMails } from "@stackra/notifications/node";
import { loaders } from "#stackra/i18n";

registerNotificationMails({
  bodies: [[OrderReceiptNotification, OrderReceiptMail]],
  catalogues: loaders,
});
```

Only the mail channel is rendered, only principals are addressed (a scope recipient is refused), and in the member's
default locale until identity answers a principal's language.

An in-app entry carries its product (`InAppMessage.product`), and `InAppStore.list(recipient, { product })` answers one
product's entries, for a per-product inbox and the ethical wall between products.

## Channels and providers

Products declare channels, never providers (ADR 0223 decision 2). The provider behind a channel is chosen per tenant
and Market by `@stackra/integrations`' `ProviderResolver` (ADR 0356): the tenant's own Connection first, then the
Market's platform Connection, both data.

| Channel port (`./contracts`)                                | Driver (`.`)                                      | Providers (connectors in OS integrations)       |
| ----------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `MailTransport`                                             | `ConnectionMailTransportDriver`                   | Resend, SES                                     |
| `SmsTransport`                                              | `ConnectionSmsTransportDriver`                    | Unifonic, Taqnyat, Twilio, Cequens              |
| `WhatsAppTransport`                                         | `ConnectionWhatsAppTransportDriver`               | Meta WhatsApp (Cloud API)                       |
| `PushTransport`                                             | `DevicePushTransportDriver`                       | Expo (mobile) and Web Push (VAPID, `aes128gcm`) |
| voice (`VoiceGateway` of `@stackra/integrations/contracts`) | `ProviderResolver.resolve("voice", <host's map>)` | Twilio                                          |

The vendor Integrations and Connections live in the OS integrations service (owner decision R3-8), so the host passes
them: each `Connection*TransportDriver` takes the host's connection class per provider code as its third argument, and
`DevicePushTransportDriver` the host's Expo Integration as its first.

```ts
export class OsSmsTransportDriver extends ConnectionSmsTransportDriver {
  constructor(resolver: ProviderResolver, log: SendLog) {
    super(resolver, log, SMS_CONNECTIONS); // provider code to the OS's vendor connection class
  }
}
```

- Every connection transport sends once per idempotency key through `SendLog` (keys and provider ids only).
- A device the push service reports gone is revoked through `PushTokenStore`; `receipts` reads Expo receipts.
- The VAPID keys and contact are platform secrets: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`,
  `WEB_PUSH_VAPID_SUBJECT`.

### Delivery events (stackra-207)

Each transport records its outcomes as `DeliveryRecorded`, the integration event `notifications.delivery.recorded.v1`
(the events package needs a dotted name, so the batch's `delivery_recorded` reads `delivery.recorded`). Its fields are a
`NotificationDeliveryEvent` from `./contracts`: `deliveryId` (the idempotency key), `channel`, `provider` (the provider
code of the host's map, `expo` or `web-push` for push), `status` and `at` (ISO 8601). Ids and codes only, never an address
or content.

| Status      | Recorded when                                                                                |
| ----------- | -------------------------------------------------------------------------------------------- |
| `sent`      | the provider accepted the message (a repeated key records nothing again)                     |
| `failed`    | the provider refused it (`ProviderRefusedError`); an outage records nothing, the job retries |
| `revoked`   | the push service reported the device gone                                                    |
| `delivered` | not recorded by this package yet: it comes from provider status callbacks                    |

The outbox is an optional trailing constructor argument (`outbox`, then `clock` on the connection transports; `outbox`
after the clock on `DevicePushTransportDriver`). Without one, nothing is recorded:

```ts
export class OsSmsTransportDriver extends ConnectionSmsTransportDriver {
  constructor(resolver: ProviderResolver, log: SendLog, outbox: EventOutbox, clock: Clock) {
    super(resolver, log, SMS_CONNECTIONS, outbox, clock);
  }
}
```

### Vendor drivers moved (STA-1281)

The eight vendor Integrations (Resend, SES with its SigV4 signer `signAwsV4`, Unifonic, Taqnyat, Twilio, Cequens, Meta
WhatsApp, Expo) and the `MAIL_CONNECTIONS`, `SMS_CONNECTIONS`, `WHATSAPP_CONNECTIONS` and `VOICE_CONNECTIONS` maps
left this package for the OS integrations service (os-104). Copy them from
`packages/communication/notifications/src/core/providers/`, `src/core/constants/*-connections.constant.ts` and
`src/core/functions/sign-aws-v4.function.ts` at commit `8d3f7b2` (`figentra/sta-666-wave12` before the move). They
import only public names (`@stackra/notifications`' `twiml`, `@stackra/notifications/contracts`,
`@stackra/integrations`, `@stackra/config`).

## Inbound WhatsApp (ADR 0448)

`WhatsAppInbound.read(body)` turns one verified WhatsApp webhook delivery into `InboundWhatsApp` messages: `text`,
`cart` (a native cart order: catalogue id, retailer ids, quantities and `MoneyAmount` unit prices) and `reply` (a
button or list row the business sent, or a template quick reply), each with the provider's message id, the customer's
E.164 number, the receiving business number's `channelId` and the id of the business message it answers (`replyTo`).

```ts
if (
  !(await verifyHmacWebhook(
    headers,
    body,
    META_WHATSAPP_WEBHOOK_SIGNATURE,
    [appSecret],
    clock.now(),
  ))
)
  throw InvalidSignatureError.create();
for (const message of await inbound.read(body)) await whatsappInbox.handle(message); // the host's own handler
```

- Verify first: the Meta Integration (OS integrations) declares `webhooks: { scheme: "hmac", signature:
META_WHATSAPP_WEBHOOK_SIGNATURE, ... }`, so `@stackra/webhooks` checks `x-hub-signature-256` before `read` runs.
- `meta` reads the Cloud API payload; statuses, media, locations and reactions are left out, as is any malformed
  message or a price its currency cannot hold. It never throws for the body.
- `memory` (dev and tests): `push(...messages)`, and the next `read` hands them out.
- The host dedupes by message id, maps `channelId` to its scope and routes carts, orders and replies (Commerce,
  OS messaging). The Meta subscribe handshake (`hub.challenge`) is the host route's.

## Templates, quiet hours and escalation

| Symbol                                                | Use                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `resolveTemplate(candidates, query)`                  | the cascade: locale chain first, then the nearest scope's override, then the code default  |
| `TemplateVariant`, `TemplateOverrides`                | a restricted record takes only the content-free variant; no fallback to the full one       |
| `assertContentFree(template)`, `RestrictedFieldError` | refuses a content-free template that reads more than `kind` and `link` (`ContentFreeData`) |
| `canMute(category, mandatory)`                        | false for a mandatory or transactional category: preferences cannot mute it                |
| `sendAfter({ category, mandatory, quietHours, now })` | the send time: now for a mandatory category or outside quiet hours, else the window's end  |
| `dueEscalations(steps, state, now)`                   | the escalation steps due for an unacknowledged notification                                |

The mandatory categories, quiet hours, channel order and escalation steps are data (settings floors, settings, rule
sets), never defaults here.

### Content-free templates (STA-964)

A record of a restricted data class (a privileged matter, a safeguarding notice, a clinical record) renders only its
content-free variant, and that variant reads nothing of the record: its kind, as a label in the recipient's language,
and a link that opens it after sign-in (`ContentFreeData`, the fields in `CONTENT_FREE_FIELDS`). `resolveTemplate`
checks the template it returns, and the notifications service calls `assertContentFree` when a studio override is
saved, so `{kind} for {client_name}` is refused with `RestrictedFieldError` (`restricted_field`, the field named).
The default wording is `templates.content_free.record` (`You have an update on a {kind}. Sign in to read it: {link}`).
A mail document reference is checked where it is authored, not here.

### Mandatory categories (ACA-539)

A pack lists the categories a recipient cannot mute and quiet hours never hold, as configuration:

```ts
export class NotificationsConfig extends BaseNotificationsConfig {
  override mandatoryCategories = ["emergency_broadcast", "pickup"];
}

canMute(notification.messageCategory ?? notification.category, config.mandatoryCategories); // false: no mute switch
sendAfter({ category, mandatory: config.mandatoryCategories, quietHours, now }); // now, even at 23:00
```

Codes are `NotificationCategory` cases or a delivery service's `messageCategory` codes (snake_case); none is
mandatory by default, and a transactional notification is never mutable either way.

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
