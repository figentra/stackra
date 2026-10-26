# AGENTS — @stackra/notifications

Messages to people (ADR 0086, 0223 as amended by 0294; R-26). Member at `packages/communication/notifications`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node`,
`./react`, `./testing`.

## Where code goes

| You are writing…            | It goes in…                                    |
| --------------------------- | ---------------------------------------------- |
| The kind base               | `src/core/bases/notification.base.ts`          |
| A value class               | `src/core/values/<name>.value.ts`              |
| A port (signature uses `.`) | `src/core/ports/<name>.port.ts`                |
| A port with no core type    | `src/contracts/ports/<name>.port.ts`           |
| A driver                    | `src/core/drivers/<name>.driver.ts`            |
| A function                  | `src/core/functions/<name>.function.ts`        |
| A type                      | `src/core/types/<name>.type.ts`                |
| The configuration           | `src/config/notifications.config.ts`           |
| Mail rendering and its hook | `src/react/mail/`                              |
| The service-queueing driver | `src/node/drivers/<name>.driver.ts`            |
| A test helper or double     | `src/testing/`                                 |
| A test                      | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## Entries and barrels

- Each entry has a stand-in barrel (`src/<entry>/index.ts`) until gen writes them (STA-339); add every new public file
  to it and to its `__tests__/index.test.ts`.
- `contracts` is the leaf. `react` imports `core`; `node` imports `core` and the internal mail renderer of `react`;
  `testing` imports them all. No symbol is exported from two entries:
  `MemoryNotifier` in `./testing` is the type of `MemoryNotifierDriver` in `.`.
- `MailMessage` is exported as a type only. `prepareNotification`, `htmlToText`, `NotificationBase`, the mail renderer
  and `MailTools` stay internal.

## This package

- `Notification` is called only. Only `recipients` is declared on the base, so `data` and the channel methods are
  found by name and a subclass writes them without `override`.
- Strings are i18n keys (`I18nKey`), never literals or concatenations. No template engine at run time: a body is a
  compiled `.mail.tsx` component rendered with `react-dom/server`.
- `.` and `./contracts` never import React; only `./node`, `./react` and `./testing` do.
- No "tenant" vocabulary: a scope recipient keeps the scope's id only (R-59).
- No parameter properties and no `#private` fields; the source keeps to erasable syntax.
- Configuration, not code: a provider is chosen by `ProviderResolver` (ADR 0356); quiet hours, mandatory categories,
  channel order, sender ids and escalation steps are data passed in. Never branch on a Market or a country.
- One provider, one Integration (ADR 0355): a provider with two channels (Twilio: SMS and voice) has one Integration and
  one Connection implementing both interfaces.
- A provider driver lives in `src/core/providers/<provider>/` as `<provider>.integration.ts` and
  `<provider>.connection.ts`, and is added to its channel's `*_CONNECTIONS` map.
- `NotificationsNotifierDriver` never names a service: the target action and its payload come from a `NotifierTarget`
  (default `MESSAGES_NOTIFIER_TARGET`); add a field to `NotifierMessage`, never a branch on the target.
- An in-app entry always names its product; a store driver filters `list` by it.
- A restricted record never falls back from the content-free template to the full one.

## PII

| Data                             | Where                                                        | Handling                                                                  |
| -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Principal id                     | `Recipient`                                                  | A public id only; the address and language are resolved at send time.     |
| Notification data                | `NotificationDelivery.data`                                  | Held in memory by the memory driver for the process's life; never logged. |
| Recipient address, body          | `OutboundMail`                                               | Passed to the transport only; this package never stores or logs it.       |
| Rendered mail                    | `renderMail`, the renderer                                   | Returned to the caller; never cached, logged or written here.             |
| Phone numbers, push targets      | `OutboundSms`, `OutboundWhatsApp`, `PushTarget`, `CallEvent` | Passed to the provider only; never logged; a dead push target is revoked. |
| Provider credentials, VAPID keys | connection `@Secret` fields, `SecretStore`                   | Read at call time; never logged or put in an error.                       |
