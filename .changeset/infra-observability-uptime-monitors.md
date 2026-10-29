---
"@stackra/infra-observability": minor
---

Monitor public URLs from outside (STA-1573): the root runway's `observability.uptime` lists each URL, its environment,
interval and the status codes that mean up; `observabilityPlan` checks it and `./node` adds `uptimeMonitors`, one
Better Stack uptime monitor per entry that pages whoever is on call. The status page lists each uptime monitor of its
environments, and `./node` now exports `statusPage`. A `pulumi/` project applies core's own stack (the registry,
static and turbo-cache Workers) from `apply-observability.yml`.
