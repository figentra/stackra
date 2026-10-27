---
"@stackra/app": minor
---

`/readyz` now runs every `HealthIndicator` the container binds as well as the `health` given to `createApp`, so the package health drivers fail readiness, by name, when a critical dependency does not answer (STA-1379).
