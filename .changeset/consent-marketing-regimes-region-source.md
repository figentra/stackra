---
"@stackra/consent": minor
---

Add `ConsentCategory.Marketing` for ads, pixels, conversions and audiences; the opt-in regimes `lgpd`, `pdpl_sa`,
`pdpl_ae` and `dpdp` beside `gdpr` and `ccpa`; `consentModeSignals` (Google Consent Mode v2 from the ledger); and the
`RegionSource` port (`./contracts`) with the Cloudflare `cf-ipcountry` driver, whose region the host feeds to
`ConsentLedger.setRegion`. Labels in all seven locales.
