---
"@stackra/scope": minor
"@stackra/database": minor
---

Move a scope subtree (ADR 0411): `ScopeNodeService.move(scope, parent)` re-paths the node and its descendants in one
statement and records `ScopeMoved` (`scope.node.moved.v1`); a parent at or below the node is `ScopeMoveInvalidError`.
`CrudService.repath(from, to)` rewrites the `ltree` prefix of a service's own `scope_path` rows from its listener.
