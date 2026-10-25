---
"@stackra/contracts": minor
---

Add the `HealthIndicator`, `KeyProvider` and `FieldCipher` ports with `HealthStatus`, `HealthReport` and `DataKey`
(owner decision 23, gaps R-27 and R-36). No drivers: a KMS `KeyProvider` and a `FieldCipher` driver come with their
consumers.
