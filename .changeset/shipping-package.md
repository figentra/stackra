---
"@stackra/shipping": minor
---

Add `@stackra/shipping`: the carrier ports (rate quote, label with cancel, pickup with cancel, tracking) that OS
integrations connectors implement, the `CarrierGateways` port that picks a carrier per tenant and Market through the
Connection, `TrackingState` with `normaliseTracking` over a connector's code map, PDF and ZPL label documents checked by
`labelDocument` and joined by `batchZpl`, and `dimensionalWeight` and `chargeableWeight` from a carrier's factor.
