# AGENTS — @stackra/notifications

<!--
Stackra file contract:
Purpose: the rules an agent follows when it changes @stackra/notifications.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0086; ADR 0223; ADR 0294; ADR 0305; ADR 0448.
-->

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
- No vendor code here (owner decision R3-8, STA-1281): a provider's Integration and Connection are a connector in the
  OS integrations service, implementing this package's `*Sender` contracts; the host passes its map to the
  `Connection*TransportDriver`s and its Expo Integration to `DevicePushTransportDriver`. Change a contract here,
  additively, when a vendor needs one.
- `NotificationsNotifierDriver` never names a service: the target action and its payload come from a `NotifierTarget`
  (a host's own, else the built-in one config `notifications.target` names: `messages` or `delivery`); add a field to
  `NotifierMessage`, never a branch on the target. A new built-in target is a new `<name>-notifier-target.constant.ts`,
  a case in the driver's `TARGETS` and in the `target` config enum (options and `NOTIFICATIONS_CONFIG_SCHEMA`).
- An address recipient (`Recipient.address`) is only for a person with no principal; a target takes it through
  `addressPayload`, and the driver refuses it, before queueing anything, when the target has none.
- Inbound WhatsApp (ADR 0448): `WhatsAppInbound` only decodes a verified delivery; the signature is a recipe
  (`META_WHATSAPP_WEBHOOK_SIGNATURE`) checked by `@stackra/webhooks` before `read`. A driver never throws for the body
  and leaves out what it cannot read; prices become `MoneyAmount` through `Money.of`, never a float. The `meta` driver is
  payload decoding only (like `twiml`); its Integration and Connection stay in OS integrations (R3-8).
- An in-app entry always names its product; a store driver filters `list` by it.
- A restricted record never falls back from the content-free template to the full one.

## PII

| Data                                | Where                                                        | Handling                                                                             |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Principal id                        | `Recipient`                                                  | A public id only; the address and language are resolved at send time.                |
| Address of a person with no account | `Recipient.address`, `NotifierAddressMessage`                | Passed to the target action only; never stored or logged here (ADR 0422 as amended). |
| Notification data                   | `NotificationDelivery.data`                                  | Held in memory by the memory driver for the process's life; never logged.            |
| Recipient address, body             | `OutboundMail`                                               | Passed to the transport only; this package never stores or logs it.                  |
| Rendered mail                       | `renderMail`, the renderer                                   | Returned to the caller; never cached, logged or written here.                        |
| Phone numbers, push targets         | `OutboundSms`, `OutboundWhatsApp`, `PushTarget`, `CallEvent` | Passed to the provider only; never logged; a dead push target is revoked.            |
| Inbound sender number, profile name | `InboundWhatsApp`                                            | Returned to the host's handler only; never logged or stored here.                    |
| Provider credentials, VAPID keys    | connection `@Secret` fields, `SecretStore`                   | Read at call time; never logged or put in an error.                                  |
