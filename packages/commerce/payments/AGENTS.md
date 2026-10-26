# AGENTS — @stackra/payments

The payment ports and the engine's `PaymentService`; no vendor driver (owner decision R3-8: vendor Integrations live
in the OS integrations service). Member at `packages/commerce/payments`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./node` (the
`PaymentsModule` and the market-pack `MarketPaymentDefaults` driver) and `./testing`.

## Where code goes

| You are writing…                   | It goes in…                                                        |
| ---------------------------------- | ------------------------------------------------------------------ |
| A container port                   | `src/contracts/ports/<name>.port.ts`                               |
| A gateway port interface or a type | `src/contracts/types/<name>.type.ts`                               |
| An enum                            | `src/contracts/enums/<name>.enum.ts`                               |
| A container driver                 | `src/core/drivers/<name>.driver.ts`                                |
| A node-only driver or the module   | `src/node/drivers/<name>.driver.ts`, `src/node/payments.module.ts` |
| A refusal                          | `src/core/errors/<name>.error.ts`                                  |
| A fake                             | `src/testing/<name>.fake.ts`                                       |
| A test                             | `__tests__/<name>.<kind>.test.ts` beside it                        |

## Adding a provider

Not here. A vendor is a connector in the OS integrations service: its `<Code>Integration` and `<Code>Connection`
(implementing `PaymentGateway` and the optional ports, `capabilities`, `provider`) live there and join the host's map
passed to `ConnectionPaymentGatewaysDriver`. Write it against `@stackra/payments/contracts` only; change a port here
when a vendor needs one, additively.

## This package

- Configuration, not code: no Market, country, currency default, fee, cap, tip preset or provider choice is written
  here. Providers per Market are `MarketPaymentDefaults` (market-pack data); per-account options are connection fields.
- No vendor code: no Integration, Connection, provider table or vendor helper in this package (R3-8, STA-1281).
- A connector calls its provider through `this.api` (the managed client). No vendor SDK, no card number, ever (PCI SAQ-A).
- A lost answer must reach `PaymentService` as `ProviderUnavailableError`; never swallow it in a driver.
- Every connection carries a `mode` field (`ConnectionMode` or `legacy-connected-account:<platform>`, `own-key` when
  absent); read it with `modeOf`. The pre-verification cap and the payout hold apply to `connected-account` only and
  their values come from `ConnectedAccountLimits` (host data), never from here.
- Webhook recipes live with their connector in OS integrations; a provider without one is learned by
  `PaymentService.reconcile`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                                 | Where                          | Handling                                                                   |
| ------------------------------------ | ------------------------------ | -------------------------------------------------------------------------- |
| Customer name, email, phone, address | request bodies to the provider | Sent only to the serving provider; never logged or stored here.            |
| Provider secret keys                 | connection `@Secret` fields    | Resolved blind by the store; read only by the connector (OS integrations). |
| Saved tokens                         | `SavedMethod.token`            | A provider token, never a card number.                                     |
