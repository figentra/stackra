# @stackra/payments

## 0.1.0

### Minor Changes

- 914465a: One capability-gateway check (STA-1383): `@stackra/contracts` adds `capabilityGuard<M>()`, and payments and shipping
  bind it to their maps. Breaking renames: `@stackra/payments` `hasCapability` is `hasPaymentCapability` and its
  `CapabilityGateways` is `PaymentCapabilityGateways`; `@stackra/shipping` `hasCapability` is `hasCarrierCapability` and
  its `CapabilityGateways` is `CarrierCapabilityGateways`.
- 59ac846: One address and one party (STA-1383). `@stackra/validation` keeps the market-format `Address` as the source and adds
  `Party` (name, email, phone, `Address`). Breaking:
  
  - `@stackra/payments/contracts`: `PaymentAddress` and `PaymentParty` are removed; `CheckoutRequest.customer` is a
    validation `Party` (the address takes `lines` and `locality`, not `line1` and `city`).
  - `@stackra/pricing/contracts`: `TaxAddress` is `Pick<Address, "country" | "region" | "postalCode">`; a missing region
    or postal code is left out instead of `null`, and `country` is a `CountryCode`.
  - `@stackra/shipping/contracts`: `ShippingAddress` extends `Address` (`city` is now `locality`, optional; the
    coordinates are a `GeoPoint`) and `ShippingParty` extends `Party`.
  - `@stackra/fiscal/contracts`: `FiscalAddress.country` is the `Address` country (`CountryCode`); the rest keeps its
    document-format shape.
  
  payments, pricing and shipping now depend on `@stackra/validation` (types only).
- 9fc14fd: Put `@stackra/rules`, `@stackra/access-log`, `@stackra/scope`, `@stackra/market-packs`, `@stackra/devices`,
  `@stackra/collaboration` and `@stackra/payments` on the framework version line beside the packages the OS catalog
  already lists, with `@stackra/segments`, which `@stackra/iam` depends on and the catalog also lacks (STA-819).
- 4829f13: Add agent payments and the SoftPos family (ADR 0446). Agent payments are the `AgentCommerceProtocols` port with
  `AgentConfirmation` and `AgentCheckoutRequest`, `PaymentService.agentCheckout` (it refuses an agent paying alone with
  `AgentConfirmationRefusedError`), `agent` on `PaymentRecord` and the memory driver. The SoftPos family is the `SoftPos`
  port, the `soft_pos` capability, `softPos` on `TerminalRequest`, `clientSecret` on `TerminalSession`, the
  `stripe-tap-to-pay` driver over the app's `StripeTerminalBridge`, the memory SoftPos driver and
  `SoftPosUnavailableError`.
- 30a33ab: Bring-your-own Square, Adyen and PayPal (STA-687, ACA-542, batch stackra-34). `TerminalGateway.cancelTerminal` takes
  the session's `providerRef` as an optional second argument and `PaymentService.cancelTerminal` passes it, so a cloud
  terminal API (Square Terminal checkouts, Adyen's Terminal API abort) cancels that session only; the gateway fake voids
  only the named session. The README maps each vendor's API to the ports and lists the Integrations, Connections and
  webhook recipes left for the OS integrations service (ADR 0443 decisions 7 and 8); `oauth-standard` now documents
  Square OAuth beside BYO Stripe. Certification pending.
- e49d5c7: Semi-integrated card terminals over a local link (ADR 0377, STA-677, batch stackra-35). `EcrTerminalGateway`
  is the till's `TerminalGateway` for an electronic cash register (ECR) protocol: sale with the tip prompt,
  pre-authorisation with completion and void, card-present refund, a cancel beside the running sale and the
  last-transaction inquiry that reconciles it; every rejected link call is a lost answer. A provider (Geidea, Network
  International) is an `EcrProfile` of pack data, not code. New `./contracts` names `EcrOutcome`, `EcrLink`,
  `EcrTiming`, `EcrProfile`, `EcrOperation`, `EcrRequestField`, `EcrResponseField`; new `./testing` fake `EcrLinkFake`.
  Certification pending: built from public descriptions with recorded-fixture tests.
- d52cd20: Add `@stackra/payments`: the gateway ports (checkout, capture, void, refund, saved-token charges with a
  merchant-initiated flag, payouts, platform onboarding, disputes, terminal sessions with a tip prompt), the
  `PaymentGateways` port with the `connection` driver that picks the tenant's Connection or the Market's platform
  Connection from market-pack data, the `PaymentService` with pay links and the `unknown` state (lookup before retry,
  manual resolution with a reason), the memory records driver, the Stripe (with Connect, disputes and Terminal),
  Checkout.com, Moyasar, HyperPay, Paymob, Fawry, Tabby and Tamara drivers, and the gateway fakes.
- 4c2a776: Pre-authorisation and partial payments (STA-1024, batch stackra-70). `PaymentCapability.PreAuth` (`pre_auth`) and
  `IncrementalAuth` (`incremental_auth`) with the `PreAuthGateway` and `IncrementalAuthGateway` ports and
  `IncrementRequest`; `PaymentService.preAuthorize` holds on a saved token and `increment` raises an authorised hold
  (capture in part and `void` release are unchanged). `PaymentBalanceService` takes concurrent partial payments against
  one balance: each part is reserved under the `PaymentBalances` lock, refused with `BalanceExceededError` when it does
  not fit, and `settle` counts each paid part once. New port `PaymentBalances` with its memory driver; the gateway fake
  pre-authorises and raises holds.
- d18a6bf: Recorded-case runners for payout and dispute Connections (STA-672, batch stackra-36). `./testing` gains
  `runPayoutCase` and `runDisputeCase` with the types `PayoutCase`, `DisputeCase` and `GatewayCaseResult`: a vendor
  Connection in OS integrations runs each recorded case (documentation source, `certification: "pending"` until a sandbox
  run passes) and gets every expectation or port rule it misses. The README maps the webhook authenticity, payouts and
  disputes of Moyasar, HyperPay, Paymob, Fawry, Tabby and Tamara from their public docs and lists what is left for OS
  integrations and `@stackra/webhooks`. No port change.
- f95818c: Add the restricted-tender kind (ADR 0445): `TenderKind`, `RestrictedTenderProgram`, `TenderLine`, `TenderSplit`, the
  `RestrictedTenderPrograms` and `TenderEligibility` ports with memory drivers and the market-pack programs driver,
  `splitTender`, `RestrictedTenderService` (split, terminal, hosted checkout, capture at fulfilment), the
  `restricted_tender` and `terminal_pin` capabilities, and `tender`, `program` and `pinEntry` on `TerminalRequest`
  (`tender` and `program` on `CheckoutRequest`).
- b523b59: Finish the gateway package and add connection modes (STA-672, STA-680). Stripe and HyperPay send form bodies through the
  managed client instead of query parameters. Stripe and Checkout.com (live and sandbox) declare their webhook signature
  recipes as Integration data. Paymob's KSA, UAE and Oman hosts are their own Integration and Connection pairs
  (`paymob-ksa`, `paymob-uae`, `paymob-oman`). Every connection carries a `mode` (`oauth-standard`, `own-key`,
  `connected-account`, `legacy-connected-account:<platform>`), read with `modeOf`; `PaymentService` refuses a payment
  above the pre-verification cap and a held payout on `connected-account` only (`ConnectedAccountLimits`), and gains
  `payout` and `paymentMethods`. `StripeConnection` acts on an `accountRef` through `Stripe-Account` and reads the
  account's enabled payment methods; `StripeConnectIntegration` runs OAuth Standard onboarding and revocation. A new
  `./node` entry ships `PaymentsModule` and the market-pack `MarketPaymentDefaults` driver over `PaymentPackSource`.
  `ProviderChoice.connectionId` is optional (a bring-your-own-only provider) and `PaymentService` takes a fourth
  constructor argument.
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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [072a443]
- Updated dependencies [ae3d280]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
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
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
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
- Updated dependencies [9fc14fd]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
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
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/money@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
