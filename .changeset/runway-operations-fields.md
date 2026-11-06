---
"@stackra/runway": minor
"@stackra/infra-observability": minor
---

Each product declares its operations in its root runway (the design of 2026-11-06).

- **Tier.** `environments.<env>.tier` names one of `staging`, `launch` or `growth`, from the finance tiers. Production defaults to `launch` and every other environment to `staging`.
- **Sizes.** The typed keys `shared.database` (`class`, `multiAz`, `storageGb`), `shared.cache` (`mode`, `class`, `nodes`) and `shared.network.natGateways` override the tier. `environmentSizesOf` resolves what an environment runs at, and `runway validate` refuses a t4g or m6g cache class in `me`.
- **Alerts and routes.** `observability.alerts` covers error rate, p95 latency, budget, database CPU, connections and free storage, and cache memory and evictions. `observability.notify` sets the routes per severity: `oncall`, `email:`, `slack:<channel id>` or `linear:<team key>`. infra-observability applies the defaults (staging and production alarmed, critical to on-call) and returns both in its plan.
