# @stackra/payments

Stackra payments: the gateway ports every payment driver implements, the engine's `PaymentService` with the `unknown`
state and lookup before retry, pay links, saved-token charges with a merchant-initiated flag, payouts and the platform
layer, disputes, terminal sessions with a tip prompt, and the provider drivers. A product never carries payment code;
it calls the engine built on these ports (ADR 0357). Which provider serves a call is the Connection's and the Market's
data (ADR 0356), never code.

**Tier:** `tier:lib` (`packages/commerce/payments`). Entries `.`, `./contracts` and `./testing`. Depends on
`@stackra/config` (`@Secret`), `@stackra/container`, `@stackra/contracts`, `@stackra/errors`, `@stackra/integrations`
(Integration, Connection, the managed client and `ConnectionStore`) and `@stackra/money`.

## What is here

| Symbol                                                                                                    | Entry         | Use                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaymentGateway`                                                                                          | `./contracts` | the gateway port: `checkout`, `lookup`, `refund`, plus `id`, `provider`, capabilities                                                                                                                                                    |
| `CaptureGateway`, `TokenGateway`, `PayoutGateway`, `PlatformGateway`, `DisputeGateway`, `TerminalGateway` | `./contracts` | the optional ports; `hasCapability(gateway, code)` narrows to one                                                                                                                                                                        |
| `PaymentCapability`, `PaymentStatus`, `ChargeInitiator`, `TransferStatus`, `DisputeStatus`, `SessionKind` | `./contracts` | the codes                                                                                                                                                                                                                                |
| `PaymentGateways`                                                                                         | `./contracts` | port: a gateway for a Market and needs, or for a stored connection                                                                                                                                                                       |
| `MarketPaymentDefaults`                                                                                   | `./contracts` | port the market-pack loader binds: a Market's providers and platform Connections                                                                                                                                                         |
| `PaymentRecords`                                                                                          | `./contracts` | port: where the engine keeps one `PaymentRecord` per merchant reference                                                                                                                                                                  |
| `PaymentService`                                                                                          | `.`           | checkout, `payLink`, `charge`, `startTerminal`, `cancelTerminal`, `reconcile`, `capture`, `void`, `refund`, `resolve`                                                                                                                    |
| `ConnectionPaymentGatewaysDriver`                                                                         | `.`           | the `connection` driver of `PaymentGateways`: tenant Connection, then Market default                                                                                                                                                     |
| `MemoryPaymentRecordsDriver`                                                                              | `.`           | the `memory` driver of `PaymentRecords`                                                                                                                                                                                                  |
| `PAYMENT_CONNECTIONS`                                                                                     | `.`           | provider code to connection class                                                                                                                                                                                                        |
| `StripeIntegration` / `StripeConnection`                                                                  | `.`           | every port: Checkout, PaymentIntents, Connect, disputes, Terminal with tipping                                                                                                                                                           |
| `CheckoutIntegration` / `CheckoutConnection` (+ sandbox)                                                  | `.`           | hosted page or payment link, capture and void, disputes                                                                                                                                                                                  |
| `MoyasarIntegration` / `MoyasarConnection`                                                                | `.`           | invoices, capture and void, token charges                                                                                                                                                                                                |
| `HyperpayIntegration` / `HyperpayConnection` (+ sandbox)                                                  | `.`           | COPYandPAY widget, CP / RV / RF, registrations with MIT standing instructions                                                                                                                                                            |
| `PaymobIntegration` / `PaymobConnection`                                                                  | `.`           | Intention and Unified Checkout, capture, void, refund                                                                                                                                                                                    |
| `FawryIntegration` / `FawryConnection` (+ sandbox)                                                        | `.`           | signed Express Checkout, status, refund                                                                                                                                                                                                  |
| `TabbyIntegration` / `TabbyConnection`                                                                    | `.`           | buy now, pay later: session, capture, close, refund                                                                                                                                                                                      |
| `TamaraIntegration` / `TamaraConnection` (+ sandbox)                                                      | `.`           | buy now, pay later: checkout, authorise and capture, cancel, refund                                                                                                                                                                      |
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

## Not here

- Ledger posting of fees, tips and refunds: the payments-ledger service, on `@stackra/ledger`.
- Webhook verification: `@stackra/webhooks` (each provider needs its signature scheme there); the engine works from
  `reconcile` until then.
- Card terminals reached over a local link (ECR) and the Geidea and Network International terminal drivers: they wait
  for the `CardTerminal` port of `@stackra/peripherals`.
- Caps, approvals, tip presets, capture timing, who may resolve by hand: settings, rules and permissions in the
  product.

## Decisions

ADR 0357 (payments architecture), ADR 0358 decision 3 (providers are drivers), ADR 0356 (provider per tenant and
Market through the Connection), ADR 0359 decision 11 (sandbox gateways), ADR 0308 (integrations), ADR 0220 (money).
