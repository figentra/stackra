---
"@stackra/runway": patch
---

The `encore-cloud` driver's verify polls `<origin>/readyz` with backoff (5 s, doubling to 60 s) while Encore Cloud
builds the pushed commit, instead of reading it once right after the push. A 404 ("application not found"), a 5xx or
no answer counts as still building until `encore.readyTimeoutMinutes` (15 by default) passes; then verify reports down
with the last answer. A first deploy no longer fails verify before Encore has built it.
