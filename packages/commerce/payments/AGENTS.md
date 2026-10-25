# AGENTS — @stackra/payments

The payment ports, the engine's `PaymentService` and the provider drivers. Member at `packages/commerce/payments`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and `./testing`.

## Where code goes

| You are writing…                   | It goes in…                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| A container port                   | `src/contracts/ports/<name>.port.ts`                           |
| A gateway port interface or a type | `src/contracts/types/<name>.type.ts`                           |
| An enum                            | `src/contracts/enums/<name>.enum.ts`                           |
| A provider                         | `src/core/providers/<code>/<code>.{integration,connection}.ts` |
| A container driver                 | `src/core/drivers/<name>.driver.ts`                            |
| A refusal                          | `src/core/errors/<name>.error.ts`                              |
| A fake                             | `src/testing/<name>.fake.ts`                                   |
| A test                             | `__tests__/<name>.<kind>.test.ts` beside it                    |

## Adding a provider

1. `<Code>Integration` (`Integration({ provider, category: IntegrationCategory.Payments, levels, auth, baseUrl })`).
   A separate sandbox or regional host is its own Integration and connection subclass.
2. `<Code>Connection extends Connection<<Code>Integration>` implementing `PaymentGateway` and the optional ports it
   supports; list them in `capabilities`; `provider` returns the Integration's code.
3. Add it to `PAYMENT_CONNECTIONS`, the `.` barrel and its `index.test.ts`; write its tests with `fakeIntegrationApi`.

## This package

- Configuration, not code: no Market, country, currency default, fee, cap, tip preset or provider choice is written
  here. Providers per Market are `MarketPaymentDefaults` (market-pack data); per-account options are connection fields.
- Every provider call goes through `this.api` (the managed client). No vendor SDK, no card number, ever (PCI SAQ-A).
- A lost answer must reach `PaymentService` as `ProviderUnavailableError`; never swallow it in a driver.
- Stripe and HyperPay POST parameters ride in the query string until the managed client has a form body (shortcut
  noted in both files).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                                 | Where                          | Handling                                                                            |
| ------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| Customer name, email, phone, address | request bodies to the provider | Sent only to the serving provider; never logged or stored here.                     |
| Provider secret keys                 | connection `@Secret` fields    | Resolved blind by the store; read only to sign (Fawry) or to build the auth header. |
| Saved tokens                         | `SavedMethod.token`            | A provider token, never a card number.                                              |
