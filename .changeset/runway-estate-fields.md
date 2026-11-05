---
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

The root runway carries the estate figentra/infra derives from (ADR 0524): `environments.<env>.region` (`me`, `eu` or
`ksa`), which `runway validate` and `stackra validate --repository` require on a product's staging and production;
`providers.aws.budgets.monthlyUsd` (default 300) beside the open thresholds; and `providers.cloudflare.records`, the
non-Worker DNS records (verification TXT, MX, CAA) under a declared zone, an MX with its priority and only A, AAAA and
CNAME proxied. `providers.aws.region` and `providers.aws.accounts` are deprecated: `runway validate` warns, and they go
in the next release. Runway exports `checkEnvironmentRegion`, `deprecatedFields` and `RegionKey`.
