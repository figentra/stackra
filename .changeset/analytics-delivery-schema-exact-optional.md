---
"@stackra/analytics": patch
---

The delivery schema's optional fields are exact-optional, so its output fits `AnalyticsDelivery` under `exactOptionalPropertyTypes` and `@Field` accepts `deliveries`. A delivery that sends an optional field as an explicit `undefined` is now refused; omit it instead.
