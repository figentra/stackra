---
"@stackra/model": minor
"@stackra/database": minor
"@stackra/scope": minor
---

Core re-paths a moved scope subtree's rows for every service. A model opts in with the new `MovesWithScope` trait (@stackra/model); `repathAllRecords(from, to)` (@stackra/database) runs `CrudService.repath` on every registered model with the trait, in the caller's transaction; and `RepathOnScopeMovedListener` (@stackra/scope/node), a queued listener with back-off, runs it on every `scope.node.moved.v1`, so a service writes no re-path listener of its own. A model without the trait is never touched; a `jsonb` scope keeps its owner's own listener.
