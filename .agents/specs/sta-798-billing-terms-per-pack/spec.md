# Feature Specification: billing terms per pack (price and collection currency, contracting entity, invoice series)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-798 (and the `@stackra/money` part of STA-797)

**Clarifications status**: complete

**Input**: A price-list key (tier, price currency) with price and collection currency separate per pack; the dated
contracting entity and billing seller per pack with an invoice series per entity; the optional 5-cent cash rounding
(US-39).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/commerce/pricing, packages/commerce/money
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0392 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `priceListKey(regionalTier, priceCurrency)` keys a plan price list.
- **FR-002** `BILLING_PACK_KEYS` names the pack entries; `billingTermsOf` reads them for a date and market, refuses
  missing values, and requires a rate source when the two currencies differ.
- **FR-003** The invoice series is one per billing seller and market.
- **FR-004** `roundCash` applies an `optional` cash rounding row only when the tenant opted in.

## Not built here

- The live central-bank and metal-rate `RateSource` drivers: they need a vendor feed.
- The `billing.*` and cash rounding entries in the market packs (`@stackra/market-packs` data).
- Tests, typecheck and build are written but not run (owner mode).
