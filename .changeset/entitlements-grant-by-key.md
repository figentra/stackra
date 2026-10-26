---
"@stackra/entitlements": minor
---

`EntitlementSource#grant` takes a locked key (`billing`, `catalogue.product_limit`) as well as the class, and both
resolve to the same record. Adds the `EntitlementKey` type, `isEntitled(source, entitlementOrKey, scope)`, key
support in `entitlementKey` and key entries in `fakeEntitlements` (STA-1225).
