---
"@stackra/scope": minor
"@stackra/gen": patch
---

In a memory-tier testing app, `ScopeTree` now reads the nodes `ScopeNodeService` writes. `MemoryScopeTreeDriver`
gains `readFrom(load)`: until it is seeded, every read goes to the tree `load` resolves to. The new
`SCOPE_TESTING_PLUGIN` (registered by `@stackra/scope/testing`) points an unseeded memory tree at the Database's
`ScopeNode` rows through `PostgresScopeTreeDriver`, so `node`, `byPath` (with the node's `level`), `ancestors` and
`descendants` see a node added through `ScopeNodeService`, as in production. A seeded tree (`fakeScopeTree`) keeps its
own list. Gen's Vitest setup imports `@stackra/scope/testing` for a member on `@stackra/scope`.
