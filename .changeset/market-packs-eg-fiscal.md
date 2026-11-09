---
"@stackra/market-packs": patch
---

The bundled `eg` pack (0.2.0, still `draft`) authors ETA's `fiscal.invoice` mandate from 2020-11-15: the `eta` driver
with the production System API's submission and document details paths, `documentTypeVersion` 1.0, amounts in EGP, the
UNCL 5305 categories mapped to T1 subtypes (S → V009, Z → V001, E → V003, O → V004), a same-day (24-hour) submission
window and a five-year retention. The issuer's `activityCode` is the unit's own option, never the pack's. It is served
only once its reviewers sign it off and it turns `live`.
