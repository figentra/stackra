---
"@stackra/runway": patch
"@stackra/cli": patch
---

A `ref:` Cloudflare account id in `runway.yaml` (`providers.cloudflare.accountId: ref:cloudflare.accountId`) no longer
reaches wrangler as the account. The deploy job resolves a `ref:`, so the product publish and the edge KV writer now
leave the job's `CLOUDFLARE_ACCOUNT_ID` in place, and refuse before any upload or KV write when the job has none
(`RunwayUnresolvedError` names the variable). A literal id is set as before. Runway exports the decision as
`cloudflareAccountEnv` (STA-2124).
