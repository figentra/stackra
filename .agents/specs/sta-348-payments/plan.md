# Plan: `@stackra/payments`

**Spec**: `.agents/specs/sta-348-payments/spec.md`

## Design

- `src/contracts`: six `Enum.of` codes; three container ports (abstract classes extending `Port`); the gateway port
  interfaces, which provider `Connection` classes implement (a Connection is a record, not a container instance, so the
  per-call provider is the connection itself, ADR 0356 decision 2); the payment types with `Money` amounts.
- `src/core/drivers`: `ConnectionPaymentGatewaysDriver` (tenant Connection first, then the Market's platform
  Connection, both from `MarketPaymentDefaults` data) and `MemoryPaymentRecordsDriver`.
- `src/core/services/payment.service.ts`: the engine mechanism; `guard` turns `ProviderUnavailableError` into the
  `unknown` state and `PaymentUnknownError`; `assert` refuses any action on `unknown`.
- `src/core/providers/<code>`: one Integration (plus a sandbox Integration where the provider has a separate host) and
  one Connection per provider; `PAYMENT_CONNECTIONS` maps provider codes to connection classes.
- `src/testing`: `PaymentGatewayFake` (all ports, `settle`, `loseNext`), `PaymentGatewaysFake`,
  `MarketPaymentDefaultsFake`.

## Constitution Check

| Law                                   | Result | Note                                                                            |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib`; imports workspace packages only                                     |
| Secrets (ADR 0173)                    | PASS   | provider keys are `@Secret` connection fields, resolved blind                   |
| Security                              | PASS   | PCI SAQ-A: hosted pages, widgets and terminals only; tokens, never card numbers |
| Configuration, not code               | PASS   | Markets, providers, fees, caps, tip presets are data, settings or rules         |
| Test placement (ADR 0022)             | PASS   | every test in `src/**/__tests__/` beside its subject                            |
| Versions and catalogs                 | PASS   | `workspace:*` and `catalog:` only                                               |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; no new ADR                            |

## Known limits

- Stripe and HyperPay POST parameters ride in the query string (the managed client sends JSON only).
- Provider webhook signature schemes are not in `@stackra/webhooks` yet; the engine works from `reconcile`.
- Paymob's non-Egypt regional hosts, Geidea and Network International are not built (see tasks).
