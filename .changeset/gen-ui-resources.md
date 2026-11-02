---
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/loyalty-kit": patch
---

Gen records every panel resource in the manifest's `ui.resources`, under `<module>.<model>`: the tree its builder
members return, with its owning `module`, its `class` and, in a package, the `from` a host imports it from. Action
and query classes in the tree are written as their locked keys, and a service or app also lists its hosted packages'
resources. `generate` takes a `loader` to run the resource classes; `stackra gen` passes one on Vite's module runner,
and a run without one refuses a member that declares a resource (`resource_loader_missing`). New refusals:
`resource_unloadable`, `builder_impure`, `resource_operation_unknown` and `resource_duplicate` (STA-1947). The loyalty
kit's manifest now records its `LoyaltyAccountResource`.
