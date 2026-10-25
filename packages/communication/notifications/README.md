# @stackra/notifications

Messages to people (ADR 0086, 0223 as amended by 0294). A notification is a class beside the model it concerns,
`resources/<model>/<name>.notification.ts`. It extends `Notification({ category })`. `recipients(event)` names who
hears it, and the type of that parameter is the trigger. An optional `data(event)` reads what every channel renders.
Each channel is a method the class declares. The mail body is a `.mail.tsx` class component of the same stem. Gen
compiles it at build time, and it is rendered to HTML and text. There is no template engine at run time (R-26).
Strings are i18n keys, never literals. The package was `@stackra/mail` (ADR 0294 decision 23).

**Tier:** `tier:lib` (`packages/communication/notifications`). Entries `.`, `./contracts`, `./react` and `./testing`.
Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`, `@stackra/i18n`,
`@stackra/money` and `@stackra/assets`. React is an optional peer, needed by `./react` and `./testing` only.

## What is here

| Entry         | Symbol                                                                | Use                                                                         |
| ------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.`           | `Notification`                                                        | the kind base: `Notification({ category })`, with `recipients(event)`       |
| `.`           | `NotificationCategory`                                                | `transactional`, `activity`, `marketing`; case data `mutable`, `optIn`      |
| `.`           | `Recipient`                                                           | `Recipient.principal(id)` or `Recipient.scope(scope)` (the scope's id only) |
| `.`           | `MailMessage` (type)                                                  | what `mail(data, mail)` returns: `mail.subject(key, values)`                |
| `.`           | `Notifier`                                                            | the port gen's listener calls: `notify(notification, event)`                |
| `.`           | `MemoryNotifierDriver`                                                | the `memory` driver: keeps deliveries for tests and dev                     |
| `.`           | `NotificationsConfig`, `NotificationsConfig$`, `NotificationsOptions` | config key `notifications`; `driver` picks the `Notifier`                   |
| `.`           | `NotificationDelivery`, `NotificationOptions`, `NotifierDriverName`   | types                                                                       |
| `./contracts` | `MailTransport`, `OutboundMail` (type)                                | the port a mail provider driver implements (`Driver(MailTransport)`)        |
| `./react`     | `useMail`, `MailProps` (type)                                         | what a `.mail.tsx` body imports                                             |
| `./testing`   | `renderMail`, `MemoryNotifier` (type), `MailTransportFake`            | render a body in a locale; read what was sent; a transport double           |

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

`NotificationsConfig.driver` picks the `Notifier` driver; runway sets it per environment (ADR 0266). Today the package
ships `memory`. The notifications service owns delivery, preferences, the log and the inbox (ADR 0223 as amended by
0270). Its `MailTransport` drivers (`memory`, `resend`) implement the port from `./contracts`.

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
overlay) unless a test passes `messages`. `MailTransportFake` stands in for `MailTransport`.
