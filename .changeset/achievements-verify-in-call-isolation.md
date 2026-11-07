---
"@stackra/achievements": patch
---

`AwardService.verify` and `verifyCode` read the award through `CallIsolation` as a system actor in the award's scope,
so the read runs in that scope and the tenant it resolves to, not in a scope session with no tenant (which the
tenant equality policy of the contract step would show no rows). The service now takes `CallIsolation` where it took
`Database` (tenancy audit 2026-11-07, gap D).
