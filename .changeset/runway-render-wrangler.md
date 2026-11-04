---
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

The `cloudflare-workers` provider now renders each Worker's wrangler config from `runway.yaml` before it deploys
(ADR 0519, STA-1989): the member's `wrangler.jsonc` stays the code facts, and the merged operational settings (the
base, the preset, `defaults`, the member and its `environments.<environment>` entry) are added in wrangler's keys.
`renderWranglerConfig` is exported from `@stackra/runway`, and a member may now set `environments`. `stackra
validate` refuses an operational key (`compatibility_date`, `workers_dev`, `observability`, `routes` and the rest) in
a new member's `wrangler.jsonc`; the four existing Workers are listed until they deploy through the provider.
