---
"@stackra/platform": patch
---

`appLockPolicy` takes the built `AppLockConfig` the container holds instead of `AppLockOptions`, so `AppLockGate`
passes its configuration straight through.
