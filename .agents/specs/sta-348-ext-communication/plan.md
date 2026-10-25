# Plan: extend notifications, integrations, i18n, validation and support

**Input**: `.agents/specs/sta-348-ext-communication/spec.md`

## Order

1. `@stackra/support` (no dependency): `Quantity`, `restrictedGtin`, `code128`; barrel in `src/core/index.ts`.
2. `@stackra/validation`: identifier algorithms and formats, E.164, country, address, GTIN, one-time codes.
3. `@stackra/i18n` (uses support and validation): locales, text helpers, address and length formatting, `./contracts`
   ports.
4. `@stackra/integrations` (uses money and validation types): options, managed client, resolver, contracts, Pass,
   Chatwoot.
5. `@stackra/notifications` (uses integrations): contracts, providers, drivers, functions, fakes.

## Shapes

- Ports are abstract classes in `src/contracts/ports/`; interfaces a provider Connection implements are types in
  `src/contracts/types/` (the payments and shipping pattern).
- Provider drivers are `Integration` + `Connection` pairs under `src/core/providers/<provider>/`, mapped by provider code
  in a `*_CONNECTIONS` constant, and reached through `ProviderResolver`.
- Pure mechanism functions take every policy value as input.
