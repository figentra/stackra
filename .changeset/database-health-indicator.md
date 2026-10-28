---
"@stackra/database": minor
---

Add `DatabaseHealthIndicatorDriver` (`./node`, the `HealthIndicator` named `database`, which runs `select 1`) and `DatabaseConfig` (key `database`, with `DatabaseConfig$` and `DatabaseConfigOptions`), whose `health` field sets the probe timeout (`PT2S`) and whether a failure is critical (STA-1379). New dependencies: `@stackra/config`, `@stackra/validation`, `zod`.
