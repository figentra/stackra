---
"@stackra/platform": patch
---

`AppLockConfig$` reads a role override's `isEnabled` and `lockAfter` as exact optionals, so `AppLockOptions.roles`
type-checks under `exactOptionalPropertyTypes` (STA-1537). The Live Activity messages name the config key
`platform.live_activity` (STA-1539).
