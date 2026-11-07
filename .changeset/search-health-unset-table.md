---
"@stackra/search": patch
---

`SearchHealthIndicatorDriver` no longer throws when `health.table` is empty. It builds, and every `check()` reports
`down` with "search health.table is not set", without searching. A deploy without the setting still fails `/readyz`,
and a testing container that binds every indicator (gen's wiring) compiles again; commerce catalogue and os parties
lost every module-booting test to the constructor error.
