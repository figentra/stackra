---
"@stackra/contracts": minor
"@stackra/payments": minor
"@stackra/shipping": minor
---

One capability-gateway check (STA-1383): `@stackra/contracts` adds `capabilityGuard<M>()`, and payments and shipping
bind it to their maps. Breaking renames: `@stackra/payments` `hasCapability` is `hasPaymentCapability` and its
`CapabilityGateways` is `PaymentCapabilityGateways`; `@stackra/shipping` `hasCapability` is `hasCarrierCapability` and
its `CapabilityGateways` is `CarrierCapabilityGateways`.
