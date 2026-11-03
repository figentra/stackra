---
"@stackra/runway": patch
"@stackra/cli": patch
---

The product publish runs wrangler with `CLOUDFLARE_ACCOUNT_ID` from `providers.cloudflare.accountId` (uploads and KV
rows), and `stackra deploy --product` passes `appLinks` from `STACKRA_APPLE_TEAMS` (`team=ID,...`) and
`STACKRA_ANDROID_CERTIFICATES` (`app=AA:BB|CC:DD,...`). `CommandRunner` options take an `env`.
