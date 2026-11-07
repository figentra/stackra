---
"@stackra/gen": patch
---

The generated tenant-isolation test now reaches the services it missed (tenancy audit 2026-11-07, section 6). gen
writes it for a service whose owned tables come only from the packages it hosts (their manifests' models with
`BelongsToTenant` or `BelongsToTenantOrPlatform`), not just for one with an owned model of its own. And gen writes
`.stackra/vitest.int.config.ts` when it emits an `.int.test.ts` under `.stackra/tests/`, so a member with no authored
int test can run gen's test through `stackra test --tier int`.
