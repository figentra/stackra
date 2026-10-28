---
"@stackra/privacy": minor
---

Add a legal hold store for products outside Figentra OS (data-layer gap gov20): `CreateLegalHoldsMigration`
(`privacy.legal_holds` and `privacy.legal_hold_refusals`, partitioned per tenant), `PostgresHoldRegistryDriver` (the
`HoldRegistry` over it, holds through subject links, each refusal logged), `PlaceHoldAction`, `ReleaseHoldAction` and
`ListHoldsQuery` with their schemas, and the `LegalHold` contracts type.
