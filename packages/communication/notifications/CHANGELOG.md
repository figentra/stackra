# @stackra/notifications

## 0.1.0

### Minor Changes

- 3a94a6e: Follow the phone's system-owned settings (STA-1536): the `SystemSettings` port with its memory driver and the abstract
  `ExpoSystemSettingsDriver` (App Tracking Transparency, Low Power Mode, an expensive connection, background refresh and
  the settings deep link), `createNotificationChannels` for one Android channel per category, `OutboundPush.channelId`,
  and `ConsentLedger.setAppTrackingDenied`, which refuses marketing on the client and in the signed snapshot.
- 6cf9d13: Content-free templates and mandatory categories (STA-964, ACA-539): `assertContentFree` refuses a content-free
  template that reads anything but the record's kind and link (`CONTENT_FREE_FIELDS`, `ContentFreeData`) with
  `RestrictedFieldError`, and `resolveTemplate` runs it; `NotificationsConfig.mandatoryCategories` lists, per pack, the
  categories a recipient cannot mute (`canMute`) and quiet hours never hold (`sendAfter`). New lang key
  `templates.content_free.record` in all seven locales.
- 2d7c8b3: <!--
  Stackra file contract:
  Purpose: the release note of stackra-207 (STA-1360) for @stackra/notifications.
  Boundary: documentation only.
  Runtime: none
  Governing contract: ADR 0177 (changesets); stackra-207.
  -->
  
  Add `NotificationDeliveryEvent` (`./contracts`: `deliveryId`, `channel`, `provider`, `status` of sent, delivered,
  failed or revoked, and `at`) and the `DeliveryRecorded` integration event (`notifications.delivery.recorded.v1`). The
  mail, SMS, WhatsApp and push transports take an optional `EventOutbox` (and the connection transports an optional
  `Clock`) and record each sent, refused or revoked delivery through it. New dependency: `@stackra/events`.
- d5141be: Config `notifications.target` picks the `notifications` driver's built-in target: `messages` (default, unchanged) or
  `delivery` (`DELIVERY_NOTIFIER_TARGET`, `delivery.message.send@1` with the category code, template values, rendered
  mail and Market). `Notification({ messageCategory })` names the delivery service's category code.
  `Recipient.address(email)` addresses a person with no account; `NotifierTarget.addressPayload` and the
  `NotifierAddressMessage` type carry it (ADR 0422 as amended, STA-1235).
- 0a8f35f: Add the inbound WhatsApp port (ADR 0448): `WhatsAppInbound` with `InboundWhatsApp` (text, native cart with
  `MoneyAmount` prices, button and list replies) in `./contracts`, the `memory` and `meta` (Cloud API) drivers, and
  Meta's webhook signature recipe `META_WHATSAPP_WEBHOOK_SIGNATURE`.
- fbb5a2e: `OutboundMail` gains `cc`, `bcc`, `replyTo`, `headers` and `attachments` (`MailAttachment`: bytes or a storage `ref`,
  with an inline `contentId`). `ConnectionMailTransportDriver` passes them through, refuses a part outside the sender's
  `supports` with `MailFeatureUnsupportedError` before calling it, and refuses injected headers. New `PreferenceStore`
  port with `MemoryPreferenceStoreDriver` and `preferenceAllows` (mandatory categories are never turned off), the signed
  one-click unsubscribe link (`unsubscribeLink`, `verifyUnsubscribeToken`, HMAC with the `NOTIFICATIONS_UNSUBSCRIBE_KEY`
  secret) and the RFC 8058 `listUnsubscribeHeaders` for bulk categories. Config adds `unsubscribeUrl` and
  `unsubscribeKey` (stackra-218, STA-1376).
- 975a6c1: Add the `./node` entry with `NotificationsNotifierDriver`, the `notifications` Notifier driver: it renders each
  notification's mail (subject and `.mail.tsx` body) and queues `messages.message.send@1` on the notifications service
  through `@stackra/clients`, once per principal. `registerNotificationMails` records the mail bodies and lang loaders it
  renders with. Follow-up that must land before the template selects `driver: notifications` for staging or production: gen's emit-registrations does not yet emit `registerNotificationMails`, so every mail notification throws a TypeError until it does. `NotifierDriverName` and `NotificationsConfig$` accept `notifications`. Add the
  `SmsTransport`, `InAppStore` and `ChatTransport` channel ports to `./contracts`, with `SmsTransportFake`,
  `InAppStoreFake` and `ChatTransportFake` in `./testing`.
- dd7825c: `NotificationsNotifierDriver` takes a `NotifierTarget` (any action and a payload mapper given the template, category,
  principal, market and rendered channels); `MESSAGES_NOTIFIER_TARGET` keeps the old default. `InAppMessage` gains a
  required `product`, and `InAppStore.list` filters by it (ADR 0422).
- 2787c1e: Add `@stackra/notifications`, messages to people (ADR 0086, 0223 as amended by 0294): the `Notification({ category })`
  kind base, `NotificationCategory`, `Recipient`, the `Notifier` port with its `memory` driver and `NotificationsConfig`,
  the `MailTransport` port in `./contracts`, `useMail` and `MailProps` for `.mail.tsx` bodies in `./react`, and
  `renderMail`, `MemoryNotifier` and `MailTransportFake` in `./testing`.
- c9c0342: Add provider drivers chosen per tenant and Market through `@stackra/integrations`' `ProviderResolver` (ADR 0356):
  Resend and SES (SigV4) mail; Unifonic, Taqnyat, Twilio and Cequens SMS; the WhatsApp Cloud API as its own
  `WhatsAppTransport` channel; Expo and Web Push (VAPID, `aes128gcm`) through `PushTransport` with dead-device revocation
  (`PushTokenStore`) and Expo receipts; Twilio voice as a `VoiceGateway` with TwiML. Connection transports send once per
  idempotency key through the new `SendLog` port. Add `resolveTemplate` (the cascade of code defaults and scope overrides
  along the locale chain, with content-free variants for restricted records), `sendAfter` (quiet hours with mandatory
  categories from settings) and `dueEscalations` (acknowledgement and escalation from rule data), plus the
  `NotificationChannel` and `TemplateVariant` enums and push and WhatsApp test fakes.
- 2e21e6a: Ship the `notifications` catalogue (category and channel names, the content-free template and the mail footer) in
  the seven languages, and include `assets` in the published files (STA-788, ADR 0403).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- fc51f13: Move every vendor Integration out of Stackra (owner decision R3-8, STA-1281): the Stripe, Checkout.com, Moyasar,
  HyperPay, Paymob, Fawry, Tabby and Tamara drivers and `PAYMENT_CONNECTIONS`; the Resend, SES, Unifonic, Taqnyat,
  Twilio, Cequens, Meta WhatsApp and Expo drivers and the `*_CONNECTIONS` maps; and Chatwoot now live in the OS
  integrations service. The ports and shared machinery stay. `ConnectionPaymentGatewaysDriver` and the
  `Connection*TransportDriver`s take the host's connection class per provider code as their third argument, and
  `DevicePushTransportDriver` takes any Integration with a managed client for Expo; callers of the ports are unchanged.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [072a443]
- Updated dependencies [0061a8e]
- Updated dependencies [2787c1e]
- Updated dependencies [0abe92d]
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [fb93026]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [3a9eb7e]
- Updated dependencies [cc8db5e]
- Updated dependencies [e7a388a]
- Updated dependencies [2787c1e]
- Updated dependencies [0a38324]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [2787c1e]
- Updated dependencies [2ead19c]
- Updated dependencies [a9d39cf]
- Updated dependencies [ae5f6cd]
- Updated dependencies [24671ba]
- Updated dependencies [975a6c1]
- Updated dependencies [865cf77]
- Updated dependencies [90e65ce]
- Updated dependencies [0046fbd]
- Updated dependencies [834d55b]
- Updated dependencies [c2b8ed4]
- Updated dependencies [2787c1e]
- Updated dependencies [47cc2f6]
- Updated dependencies [2432cca]
- Updated dependencies [ffda24c]
- Updated dependencies [fa0ed99]
- Updated dependencies [09823c1]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [09080ac]
- Updated dependencies [0a20a9f]
- Updated dependencies [2787c1e]
- Updated dependencies [3d34a5d]
- Updated dependencies [3b19f6d]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [f04fec9]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [fc51f13]
- Updated dependencies [c7e6988]
- Updated dependencies [d19a3d5]
  - @stackra/integrations@0.1.0
  - @stackra/assets@0.1.0
  - @stackra/events@0.1.0
  - @stackra/outbox@0.1.0
  - @stackra/clients@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/money@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
