---
"@stackra/validation": minor
"@stackra/payments": minor
"@stackra/pricing": minor
"@stackra/shipping": minor
"@stackra/fiscal": minor
---

One address and one party (STA-1383). `@stackra/validation` keeps the market-format `Address` as the source and adds
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
