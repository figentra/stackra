---
"@stackra/container": patch
---

The container now builds `Container` itself, as gen's `CONTAINER_BUILT` already assumed: a class that injects
`Container` (to read an optional binding at call time, such as `CallIsolation` in outbox's `PruneOutboxAction`,
`MaintainChangeLogAction` and `WarehouseChangeSink`) gets the root container, at the root and inside a request scope.
Before this, resolving such a class threw `UnboundTokenError: Nothing binds Container`, at boot for an exported
singleton. `Token` also accepts `Container`, whose private constructor made `deps: [Container]` in a wiring a type
error. Skip `@stackra/*` 0.28.0 in a host that uses data-maintenance or data-transfer; take 0.28.1.
