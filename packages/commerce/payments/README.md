<!-- Purpose: the reader guide of @stackra/payments: what is exported, taking a payment, restricted tenders, agent payments, SoftPos tap to pay, pre-authorised tabs, partial payments against one balance, the unknown state, provider choice, the Square, Adyen and PayPal bring-your-own drivers, the semi-integrated ECR terminals (Geidea, Network International), the regional gateways' webhooks, payouts and disputes with the recorded-case runners. Boundary: docs of packages/commerce/payments only. Runtime: none (Markdown). Governing contract: ADR 0357; ADR 0445; ADR 0446; ADR 0294; STA-1024; STA-687; ACA-542; ADR 0377; STA-677; STA-672; STA-1091; ADR 0443. -->

# @stackra/payments

Stackra payments: the gateway ports every payment driver implements, the engine's `PaymentService` with the `unknown`
state and lookup before retry, pay links, saved-token charges with a merchant-initiated flag, payouts and the platform
layer, disputes and terminal sessions with a tip prompt. The vendor drivers (Stripe, Checkout.com, Moyasar, HyperPay,
Paymob, Fawry, Tabby, Tamara) are connectors in the OS integrations service (owner decision R3-8). A product never carries payment code;
it calls the engine built on these ports (ADR 0357). Which provider serves a call is the Connection's and the Market's
data (ADR 0356), never code.

**Tier:** `tier:lib` (`packages/commerce/payments`). Entries `.`, `./contracts` and `./testing`. Depends on
`@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/integrations`
(Integration, Connection, the managed client and `ConnectionStore`), `@stackra/money` and `@stackra/validation` (types
only: a checkout's `customer` is its `Party`, with the one `Address`; `PaymentParty` and `PaymentAddress` are gone).

## What is here

| Symbol                                                                                                    | Entry         | Use                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaymentGateway`                                                                                          | `./contracts` | the gateway port: `checkout`, `lookup`, `refund`, plus `id`, `provider`, capabilities                                                                                                                                                    |
| `CaptureGateway`, `TokenGateway`, `PayoutGateway`, `PlatformGateway`, `DisputeGateway`, `TerminalGateway` | `./contracts` | the optional ports; `hasPaymentCapability(gateway, code)` narrows to one                                                                                                                                                                        |
| `PaymentCapability`, `PaymentStatus`, `ChargeInitiator`, `TransferStatus`, `DisputeStatus`, `SessionKind` | `./contracts` | the codes                                                                                                                                                                                                                                |
| `PaymentGateways`                                                                                         | `./contracts` | port: a gateway for a Market and needs, or for a stored connection                                                                                                                                                                       |
| `MarketPaymentDefaults`                                                                                   | `./contracts` | port the market-pack loader binds: a Market's providers and platform Connections                                                                                                                                                         |
| `PreAuthGateway`, `IncrementalAuthGateway`, `IncrementRequest`                                            | `./contracts` | the optional ports for a hold on a saved token (`pre_auth`) and a raised hold (`incremental_auth`)                                                                                                                                       |
| `PaymentBalances`, `PaymentBalance`, `BalancePart`                                                        | `./contracts` | port: one amount due paid in parts, with the lock that serialises its changes                                                                                                                                                            |
| `PaymentBalanceService`, `MemoryPaymentBalancesDriver`, `BalanceExceededError`                            | `.`           | partial payments: `open`, `remaining`, `checkout`, `startTerminal`, `settle`; the `memory` driver; the refusal of a part that does not fit                                                                                               |
| `PaymentRecords`                                                                                          | `./contracts` | port: where the engine keeps one `PaymentRecord` per merchant reference                                                                                                                                                                  |
| `PaymentService`                                                                                          | `.`           | checkout, `payLink`, `charge`, `preAuthorize`, `increment`, `agentCheckout`, `startTerminal`, `cancelTerminal`, `reconcile`, `capture`, `void`, `refund`, `resolve`                                                                      |
| `RestrictedTenderService`, `splitTender`                                                                  | `.`           | restricted tenders (EBT, meal vouchers): `split`, `startTerminal`, `checkout`, `captureAtFulfilment`                                                                                                                                     |
| `TenderKind`, `RestrictedTenderPrograms`, `TenderEligibility`                                             | `./contracts` | the tender kind, and the ports for a Market's programs (pack data) and line eligibility (a rule set)                                                                                                                                     |
| `MemoryRestrictedTenderProgramsDriver`, `MemoryTenderEligibilityDriver`                                   | `.`           | the `memory` drivers of the two restricted-tender ports                                                                                                                                                                                  |
| `MarketPackRestrictedTenderProgramsDriver`                                                                | `./node`      | the `market-pack` driver of `RestrictedTenderPrograms` (pack key `payments.restricted-tenders`)                                                                                                                                          |
| `AgentCommerceProtocols`, `AgentConfirmation`, `AgentCheckoutRequest`                                     | `./contracts` | the port that verifies an agent protocol's proof of the shopper's wallet confirmation, and its types                                                                                                                                     |
| `MemoryAgentCommerceProtocolsDriver`, `AgentConfirmationRefusedError`                                     | `.`           | the `memory` driver of `AgentCommerceProtocols`; the refusal of an agent paying alone                                                                                                                                                    |
| `SoftPos`, `SoftPosReadiness`, `StripeTerminalBridge`                                                     | `./contracts` | the SoftPos (tap to pay) port bound on the phone, and the bridge the staff app binds over Stripe Terminal's SDK                                                                                                                          |
| `StripeTapToPaySoftPosDriver`, `MemorySoftPosDriver`, `SoftPosUnavailableError`                           | `.`           | the `stripe-tap-to-pay` and `memory` SoftPos drivers; the refusal of a phone that cannot be a reader                                                                                                                                     |
| `ConnectionPaymentGatewaysDriver`                                                                         | `.`           | the `connection` driver of `PaymentGateways`: tenant Connection, then Market default                                                                                                                                                     |
| `MemoryPaymentRecordsDriver`                                                                              | `.`           | the `memory` driver of `PaymentRecords`                                                                                                                                                                                                  |
| the refusals                                                                                              | `.`           | `PaymentUnknownError`, `NoPaymentProviderError`, `MerchantInitiatedNotAllowedError`, `InvalidPaymentTransitionError`, `CapabilityUnsupportedError`, `PaymentFieldRequiredError`, `PaymentDeclinedError`, `ResolutionReasonRequiredError` |
| `EcrTerminalGateway`                                                                                      | `.`           | the semi-integrated terminal driver on the till: one class, one `EcrProfile` per provider (Geidea, Network International), over the `EcrLink`                                                                                            |
| `EcrProfile`, `EcrLink`, `EcrTiming`, `EcrOutcome`, `EcrOperation`, `EcrRequestField`, `EcrResponseField` | `./contracts` | a provider's ECR protocol as pack data, the local link it travels over, and the answer outcomes                                                                                                                                          |
| `EcrLinkFake`                                                                                             | `./testing`   | an `EcrLink` replaying recorded terminal answers                                                                                                                                                                                         |
| `PaymentGatewayFake`, `PaymentGatewaysFake`, `MarketPaymentDefaultsFake`                                  | `./testing`   | an in-memory provider that can lose answers, and the two port fakes                                                                                                                                                                      |
| `runPayoutCase`, `runDisputeCase`, types `PayoutCase`, `DisputeCase`, `GatewayCaseResult`                 | `./testing`   | run one recorded vendor case through a payout or dispute Connection and list every expectation or port rule it misses (certification pending until a sandbox run)                                                                        |

## Taking a payment

```ts
const session = await payments.checkout(market, {
  reference: order.id,
  amount,
  tip, // optional tip line, kept apart on the record
  description: order.title,
  returnUrl,
  cancelUrl,
  captureLater: settings.payments.capture === "on_shipment", // a setting, not code
});
// on return or webhook
const record = await payments.reconcile(order.id);
if (record.status === PaymentStatus.Authorized) await payments.capture(order.id);
```

## Pre-authorised tabs (STA-1024)

A tab holds an amount on a saved card, raises the hold as it grows, then captures what was spent or releases the rest.
A card read on a terminal with `captureLater: true` is held the same way.

```ts
await payments.preAuthorize({
  reference: tab.id,
  method,
  amount: opening,
  initiator: ChargeInitiator.Customer,
});
await payments.increment(tab.id, more, `${tab.id}:${round}`); // needs `incremental_auth`; a retry is counted once
await payments.capture(tab.id, spent); // in part; or payments.void(tab.id) to release the hold
```

`preAuthorize` asks for `PaymentCapability.PreAuth` and `increment` for `PaymentCapability.IncrementalAuth`, so only a
provider whose Connection has them serves the call. The opening amount and when a tab is raised are product settings.

## Partial payments against one balance (STA-1024)

Several payers pay one amount due at once (pay at table: each guest scans the QR or taps the terminal). Each part is
reserved under the balance's lock, so the open and paid parts never exceed the balance, then paid through
`PaymentService` under its own reference. `settle` marks each open part paid or released and counts a part once
however often it runs (call it from the return page and from the webhook).

```ts
await balances.open(check.id, check.total);
const session = await balances.checkout(market, check.id, { reference: `${check.id}:${seat}`, amount: share, ... });
// a part that does not fit what is left is refused with BalanceExceededError
const balance = await balances.settle(check.id); // balance.settledAt once the paid parts cover it
```

The host binds a durable `PaymentBalances` whose `exclusive` takes a `Locks` lease (`@stackra/locking`) on
`payments.balance:<reference>`; the memory driver locks one process only. How a check is split (seat, item, even) is the
product's.

## Restricted tenders (ADR 0445)

A restricted tender (EBT SNAP, a meal voucher) pays only the lines its rule set allows. The program is pack data under
`payments.restricted-tenders` (`code`, `ruleSet`, `taxExempt`, `captureAtFulfilment`, `pinEntry`, `status`);
eligibility is the host's `TenderEligibility` driver over `@stackra/rules`.

```ts
const { split, session } = await tenders.startTerminal(market, {
  reference: `${order.id}:ebt`,
  terminalId,
  program: "snap", // a code from the pack
  lines, // TenderLine: PaymentLine plus tax and category
  balance, // optional: what the card holds
});
// split.remainder goes on an ordinary tender under order.id
// online, at pickup or delivery, against the picked basket:
await tenders.captureAtFulfilment(market, {
  reference: `${order.id}:ebt`,
  program: "snap",
  lines: picked,
});
```

`TerminalRequest` carries `tender`, `program` and `pinEntry`; a request asks for `restricted_tender` and
`terminal_pin` capabilities, so only a provider that has them serves it. The PIN is entered on the terminal and never
reaches the platform. The EBT and meal-voucher processor connectors wait on the owner's processor choice.

## Agent payments (ADR 0446)

An outside AI shopping agent may build a cart, but never pays alone: the shopper confirms in their own wallet, the
protocol connector (OS integrations, behind `AgentCommerceProtocols`) verifies the proof, and `agentCheckout` charges
the wallet's token only for the confirmed reference, before the confirmation expires and up to the confirmed amount.

```ts
const record = await payments.agentCheckout({ protocol, proof, reference: cart.id, amount });
// record.agent = { protocol, agent }; a retry returns the same record
```

## SoftPos: tap to pay on the phone (ADR 0446)

The server opens the session; the staff app's phone reads the card; the server captures or cancels.

```ts
// server
const session = await payments.startTerminal(market, {
  reference,
  terminalId,
  amount,
  softPos: true,
  captureLater: true,
});
// phone (SoftPos bound to StripeTapToPaySoftPosDriver over the app's StripeTerminalBridge)
await softPos.connect(location); // a till setting
await softPos.collect(session); // needs session.clientSecret
// server
await payments.reconcile(reference);
await payments.capture(reference);
```

A request with `softPos: true` asks for `PaymentCapability.SoftPos`, so only a provider whose Connection opens tap-to-pay
sessions serves it. The Stripe Connection (OS integrations) must return `clientSecret` and serve the SDK's connection
token; a Gulf SoftPOS SDK per pack waits on vendor access.

## The unknown state

When a provider call's answer is lost (`ProviderUnavailableError` from the managed client), the payment becomes
`unknown`. Every action on it (`capture`, `void`, `refund`, a new `checkout`, a retried `charge`) is refused with
`PaymentUnknownError` until `reconcile(reference)` looks it up at the provider, or a manager calls
`resolve(reference, status, { by, reason })` with a reason. A retried charge with a used reference returns the record,
so a token is never charged twice.

## Choosing the provider

`ConnectionPaymentGatewaysDriver` asks `MarketPaymentDefaults` for the Market's providers (market-pack data, in
order), takes the tenant's own Connection of the first provider that has every capability the call needs, and
otherwise the Market's platform Connection. A stored payment always goes back to the connection that served it.
Sandboxes use the `-sandbox` providers (their own Integrations and hosts), chosen by the same data.

The connection class per provider code is the host's: the OS integrations service owns the vendor Connections and
subclasses the abstract driver, declaring its map as `drivers` (the constructor takes class tokens only, ADR 0294
rule 17).

```ts
export class OsPaymentGatewaysDriver extends ConnectionPaymentGatewaysDriver {
  protected override readonly drivers = PAYMENT_CONNECTIONS; // provider code to the OS's vendor connection class
}
```

## Vendor drivers moved (STA-1281)

The eight vendor Integrations and Connections (with the sandbox and regional ones, Stripe Connect, the webhook
recipes, `stripeParams`, `hyperpayResult` and `sha256Hex`) and `PAYMENT_CONNECTIONS` left this package for the OS
integrations service (os-104). Copy them from `packages/commerce/payments/src/core/providers/` and
`src/core/constants/payment-connections.constant.ts` at commit `8d3f7b2`
(`figentra/sta-666-wave12` before the move). They import only public names: `@stackra/payments` (`totalOf`, the refusals), `@stackra/payments/contracts`
and `@stackra/integrations`.

## Square, Adyen and PayPal: bring your own (stackra-34, STA-687)

Owner decision D4 (2026-10-27): built now from the vendors' public API docs with recorded-fixture tests, shipped
**certification pending**. Under ADR 0443 decisions 7 and 8 every class that names a vendor is OS integrations code, so
the three Integrations and Connections are built there (beside the Stripe one moved by os-104), not here. This package
carries their ports unchanged except one additive change: `TerminalGateway.cancelTerminal(terminalId, providerRef?)`
now receives the session's `providerRef`, because both cloud terminal APIs cancel a checkout by its id.

| Vendor   | Mode                                                                | Capabilities                                                                             | Port to API (public docs)                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `square` | `oauth-standard` (Square OAuth, no fee) or `own-key` (access token) | checkout, capture, tokens, terminal, terminal_tips, disputes                             | `checkout`: Checkout API payment link; `lookup`: Payments/Orders API; `capture`/`void`: complete/cancel a delayed-capture payment; `charge`: card on file as `source_id`; `refund`: Refunds API; `startTerminal`/`terminalSession`/`cancelTerminal`: Terminal API checkouts on the paired device id; disputes: Disputes API; idempotency key from the reference                    |
| `adyen`  | `own-key` (API key, merchant account, live URL prefix)              | checkout, capture, tokens, pre_auth, incremental_auth, terminal, terminal_tips, disputes | `checkout`: Checkout API payment link; `capture`/`void`/`refund`: modifications on the PSP reference; `charge`: stored payment method with the recurring processing model from `initiator`; `authorize`/`increment`: pre-authorisation and amount update; terminals: cloud Terminal API payment, transaction status and abort by the session; `Idempotency-Key` from the reference |
| `paypal` | `own-key` (REST client id and secret)                               | checkout, capture, tokens, disputes                                                      | `checkout`: Orders v2 order, approve link as the session url; `lookup`: get order; `capture`/`void`: capture or void the authorization; `charge`: vault payment token; `refund`: refund the capture; disputes: Disputes API; `PayPal-Request-Id` from the reference                                                                                                                |

Availability is pack data: each provider joins `payments.byo-providers` as `planned` and is flipped to live per pack
(`MarketPackPaymentDefaultsDriver` already reads only live entries). Readers stay server-driven (ADR 0378 decision 1):
`CardTerminal` in `@stackra/peripherals` only records which Square or Adyen reader a till uses, so no peripheral
driver is needed for them.

Left for OS integrations: the `SquareIntegration`, `AdyenIntegration`, `PayPalIntegration` classes and their
Connections (and `-sandbox` variants), their webhook recipes (Square HMAC over URL and body, Adyen HMAC on notification
items, PayPal verify-webhook-signature), the OAuth flow of Square, their entries in the host's provider map, the
recorded-fixture tests, and the pack rows. BYO Stripe (ACA-542) is `ConnectionMode.OAuthStandard` here; its OAuth
onboarding and revocation are `StripeConnectIntegration` in OS integrations (ADR 0390 decision 3).

## Semi-integrated terminals: Geidea and Network International (ADR 0377, STA-677)

The Gulf terminals are semi-integrated: the till sends the amount to the terminal over a local link under the
provider's electronic cash register (ECR) protocol, and the terminal talks to its acquirer. `EcrTerminalGateway`
runs on the till (Electron main or the Expo staff app) as the till's `TerminalGateway`; the link is `@stackra/peripherals`'
`CardTerminal` driver `ecr` (`EcrCardTerminalDriver`, `./desktop`), which satisfies `EcrLink` structurally, so neither
package imports the other.

```ts
const profile = pack.payments.terminalProviders.geidea; // EcrProfile, pack data
await cardTerminal.pair({
  terminalId,
  provider: profile.provider,
  address: "tcp://10.0.0.30:6000",
});
const gateway = new EcrTerminalGateway({
  id: till.terminalConnection,
  profile,
  link: cardTerminal,
  currency,
});
// the till's PaymentService resolves this gateway for the provider
const session = await payments.startTerminal(market, { reference, terminalId, amount, tipPrompt });
await payments.cancelTerminal(reference); // the cancel goes beside the running sale, then reconcile reads the outcome
```

- **One class, a profile per provider.** The operation codes, the field order of a request and an answer, the
  separator, the result codes (`EcrOutcome`) and the link timing are an `EcrProfile`: pack data under
  `market-pack:<code>.payments.terminal-providers` (ADR 0377 decision 8), never constants here. The `geidea` and
  `network-international` drivers are two profiles. Capabilities follow the profile: `terminal_tips` when it sends the
  tip prompt, `capture` when it has the authorise, completion and void codes.
- **Tip prompt.** `TerminalRequest.tipPrompt` (the product's tip settings) is sent as the percentages and the custom
  flag; the answer's tip comes back on the session.
- **Cancel-then-reconcile.** The terminal runs one operation at a time, so calls queue. A rejected link call is a lost
  answer (`ProviderUnavailableError`), so `PaymentService` records `unknown`. `cancelTerminal` signals the cancel beside
  the running sale; `lookup` waits for it to settle and answers from what the till saw, else from the terminal's
  last-transaction inquiry. An inquiry naming another payment throws a lost answer, so the payment stays `unknown` for a
  manager's `resolve` rather than being guessed. An integrated card payment never completes offline.
- **Sale, refund, void.** A sale is `startTerminal`; `captureLater` authorises and `capture`/`void` complete or void it;
  `refund` is card-present against the original `providerRef`. `checkout` refuses: no hosted page.
- **Certification pending.** Neither provider's ECR specification or test terminal was available (owner decision D3,
  2026-10-27); the driver was built from the public descriptions of the integrations (purchase, refund, void,
  last-transaction inquiry) with recorded-fixture tests. Each provider's profile and its certification row in
  `launch-gate:sa` / `launch-gate:ae` come with the specification.

Left for others: the two profile records and the `payments.terminal-providers` pack rows (market packs, with the
specifications); the server half of ADR 0377 decision 2 (the till reports a terminal result to the payments service,
which records it pending confirmation and confirms it against the provider's settlement report through a Connection in
OS integrations, ADR 0443 decision 7); the till's `PaymentGateways` binding (the host); Paymob and NeoLeap/Surepay
profiles (ADR 0377 decisions 5 and 6); serial, USB and Bluetooth links (native transports in `@stackra/peripherals`).

## Regional gateways: webhooks, payouts and disputes (stackra-36, STA-672)

Owner decision D3 (2026-10-27): built from the vendors' public documentation with recorded-fixture tests, shipped
**certification pending** (no sandbox credentials yet). Under ADR 0443 decisions 7 and 8 every class that names a
vendor, and every webhook recipe, is OS integrations code, so this package carries no Moyasar, HyperPay, Paymob,
Fawry, Tabby or Tamara code. What Stackra owns here is the kit the OS Connections are certified with:

```ts
import { runDisputeCase, runPayoutCase } from "@stackra/payments/testing";

const api = fakeIntegrationApi({ "POST /v1/payouts": { status: 201, body: recorded } }); // OS integrations
const result = await runPayoutCase(new VendorConnection(api.connection), {
  id: "vendor.payout-accepted",
  source: "vendor API reference, Payouts: create",
  certification: "pending",
  request: { reference: "po_1", amount, destination: "acct_1" },
  expect: { status: TransferStatus.Pending, providerRef: "pyt_1" },
});
expect(result.mismatches).toEqual([]);
```

- `runPayoutCase` checks the recorded state and id plus the port rules: a non-empty provider id, a `TransferStatus`
  code, a declined payout answered `failed` (not thrown), a lost answer refused as `provider_unavailable`.
- `runDisputeCase` runs a `read`, `respond` (with evidence) or `accept` and checks the dispute asked is the one
  answered, a `DisputeStatus` code, a reason, a positive amount, a valid `respondBy`, that a response leaves
  `needs_response` and an accept ends `accepted` or `lost`, plus every recorded field.
- A case records its `source` (the documentation page) and `certification`; it flips to `certified` only after the
  same case passes against the vendor's sandbox.

What each vendor publishes (public docs, unverified against a sandbox):

| Vendor                    | Webhook authenticity                                                                                                   | Fits `hmac` recipe? | Payouts (`payouts`)                                                  | Disputes (`disputes`)                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Moyasar                   | a `secret_token` the merchant sets, echoed in the JSON body                                                            | no (body token)     | Payouts API from the Moyasar balance to a payout account             | none in the API (dashboard)                                                 |
| HyperPay (OPPWA)          | body encrypted AES-256-GCM with the notification key, IV and tag in `x-initialization-vector` / `x-authentication-tag` | no (encrypted body) | none (acquirer settles)                                              | chargebacks arrive as `CB` transactions in notifications; no respond/accept |
| Paymob (EG, KSA, UAE, OM) | `hmac` query parameter: HMAC-SHA512 hex over the values of a fixed ordered list of transaction fields                  | no (field order)    | separate Payouts (disbursement) product, its own API and credentials | none in the API                                                             |
| Fawry                     | `messageSignature`: SHA-256 hex over ordered notification fields followed by the secure key                            | no (keyed digest)   | none                                                                 | none                                                                        |
| Tabby                     | no signature: a header name and value the merchant registers with the webhook, then confirm by retrieving the payment  | no (shared header)  | none (Tabby settles)                                                 | none (handled by Tabby)                                                     |
| Tamara                    | `tamaraToken` (query, and `Authorization: Bearer`): a JWT HS256 signed with the merchant's notification token          | no (JWT)            | none (Tamara settles)                                                | none (handled by Tamara)                                                    |

None of the six is an HMAC over the raw body, so none can be a `WebhookSignature` recipe today: each needs a scheme
in `@stackra/webhooks` (body token, encrypted body, ordered-field HMAC, keyed field digest, shared header, JWT). Until
then each is learned by `PaymentService.reconcile`, as before. Their Connections declare only `payouts` (Moyasar, and
Paymob when the disbursement credentials are on the connection) and declare no `disputes`; `PaymentService.payout` already
refuses `capability_unsupported` for a provider without `payouts`, and a host reads disputes only from a gateway that
declares `disputes`. Platform onboarding (`PlatformGateway`) stays Stripe and Checkout.com
only: none of the six publishes a sub-merchant onboarding API.

Left for others: the six Connections' payout and dispute methods, their recorded cases and certification (OS
integrations, os-104); the six webhook schemes and their verifiers (`@stackra/webhooks`, a new batch); the pack rows
that switch payouts on per Market.

## Not here

- Ledger posting of fees, tips and refunds: the payments-ledger service, on `@stackra/ledger`.
- Webhook verification: `@stackra/webhooks` (each provider needs its signature scheme there); the engine works from
  `reconcile` until then.
- Caps, approvals, tip presets, capture timing, who may resolve by hand: settings, rules and permissions in the
  product.

## Decisions

STA-672 and STA-1091 (regional gateways' webhooks, payouts and disputes, stackra-36), ADR 0377 and STA-677 (semi-integrated terminals over a local link, stackra-35), STA-687 and ACA-542 (bring-your-own Square, Adyen, PayPal and Stripe), ADR 0443 decisions 7 and 8 (vendor code in OS integrations), STA-1024 (pre-authorisation and partial payments), ADR 0446 (agent payments and SoftPos), ADR 0445 (restricted tenders and the PIN step), ADR 0378 (card terminals and Tap to Pay), ADR 0357 (payments architecture), ADR 0358 decision 3 (providers are drivers), ADR 0356 (provider per tenant and
Market through the Connection), ADR 0359 decision 11 (sandbox gateways), ADR 0308 (integrations), ADR 0220 (money).
