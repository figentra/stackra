---
"@stackra/gen": patch
---

A service's wiring now binds the ports the action pipeline itself requires for what the service declares, not only
the ports a constructor injects: `EventOutbox` for an integration event (own or hosted, which `ctx.publish` writes), a
`meter` or `analytics`; `IdempotencyStore` for an action that is not `Idempotency.Never`; `DeviceSequenceStore`,
`OfflineCapStore`, `ReviewItemSink` and `StepUpCheck` for `offline`, `offline.cap`, `accepts` and `stepUp`. Before, a
service that only published through `ctx.publish`, or only declared `idempotency`, threw "… is not bound".
