<!-- Purpose: the reader guide of @stackra/payments: what is exported, taking a payment, restricted tenders, agent payments, SoftPos tap to pay, pre-authorised tabs, partial payments against one balance, the unknown state, provider choice. Boundary: docs of packages/commerce/payments only. Runtime: none (Markdown). Governing contract: ADR 0357; ADR 0445; ADR 0446; ADR 0294; STA-1024. -->

# @stackra/payments

Stackra payments: the gateway ports every payment driver implements, the engine's `PaymentService` with the `unknown`
state and lookup before retry, pay links, saved-token charges with a merchant-initiated flag, payouts and the platform
layer, disputes and terminal sessions with a tip prompt. The vendor drivers (Stripe, Checkout.com, Moyasar, HyperPay,
Paymob, Fawry, Tabby, Tamara) are connectors in the OS integrations service (owner decision R3-8). A product never carries payment code;
it calls the engine built on these ports (ADR 0357). Which provider serves a call is the Connection's and the Market's
data (ADR 0356), never code.

**Tier:** `tier:lib` (`packages/commerce/payments`). Entries `.`, `./contracts` and `./testing`. Depends on
`@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/integrations`
(Integration, Connection, the managed client and `ConnectionStore`) and `@stackra/money`.

## What is here

| Symbol                                                                                                    | Entry         | Use                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaymentGateway`                                                                                          | `./contracts` | the gateway port: `checkout`, `lookup`, `refund`, plus `id`, `provider`, capabilities                                                                                                                                                    |
| `CaptureGateway`, `TokenGateway`, `PayoutGateway`, `PlatformGateway`, `DisputeGateway`, `TerminalGateway` | `./contracts` | the optional ports; `hasCapability(gateway, code)` narrows to one                                                                                                                                                                        |
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
| `PaymentGatewayFake`, `PaymentGatewaysFake`, `MarketPaymentDefaultsFake`                                  | `./testing`   | an in-memory provider that can lose answers, and the two port fakes                                                                                                                                                                      |

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
subclasses the driver with its map.

```ts
export class OsPaymentGatewaysDriver extends ConnectionPaymentGatewaysDriver {
  constructor(store: ConnectionStore, defaults: MarketPaymentDefaults) {
    super(store, defaults, PAYMENT_CONNECTIONS); // provider code to the OS's vendor connection class
  }
}
```

## Vendor drivers moved (STA-1281)

The eight vendor Integrations and Connections (with the sandbox and regional ones, Stripe Connect, the webhook
recipes, `stripeParams`, `hyperpayResult` and `sha256Hex`) and `PAYMENT_CONNECTIONS` left this package for the OS
integrations service (os-104). Copy them from `packages/commerce/payments/src/core/providers/` and
`src/core/constants/payment-connections.constant.ts` at commit `8d3f7b2`
(`figentra/sta-666-wave12` before the move). They import only public names: `@stackra/payments` (`totalOf`, the refusals), `@stackra/payments/contracts`
and `@stackra/integrations`.

## Not here

- Ledger posting of fees, tips and refunds: the payments-ledger service, on `@stackra/ledger`.
- Webhook verification: `@stackra/webhooks` (each provider needs its signature scheme there); the engine works from
  `reconcile` until then.
- Card terminals reached over a local link (ECR) and the Geidea and Network International terminal drivers: they wait
  for the `CardTerminal` port of `@stackra/peripherals`.
- Caps, approvals, tip presets, capture timing, who may resolve by hand: settings, rules and permissions in the
  product.

## Decisions

STA-1024 (pre-authorisation and partial payments), ADR 0446 (agent payments and SoftPos), ADR 0445 (restricted tenders and the PIN step), ADR 0378 (card terminals and Tap to Pay), ADR 0357 (payments architecture), ADR 0358 decision 3 (providers are drivers), ADR 0356 (provider per tenant and
Market through the Connection), ADR 0359 decision 11 (sandbox gateways), ADR 0308 (integrations), ADR 0220 (money).
