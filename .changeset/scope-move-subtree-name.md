---
"@stackra/scope": patch
---

Rename `ScopeNodeService.move(scope, parent)` to `moveSubtree(scope, parent)`, so it no longer clashes with the
inherited `CrudService.move(id, parentId)` (the `HasTree` re-parent of one row). Behaviour is unchanged (ADR 0411).
