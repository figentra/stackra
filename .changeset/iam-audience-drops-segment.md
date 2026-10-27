---
"@stackra/iam": minor
---

IAM is permission-only and knows no segments (ADR 0462 decision 1): `Audience` is `ScopeRef | RoleRef`, `Audience$`
refuses `{ kind: "segment" }`, `PolicySnapshot` and `MemoryPolicyState` drop `segments` (an older snapshot event's
`segments` key is ignored), and the decision point and visibility filter no longer match segment audiences. The
`@stackra/segments` dependency is removed. `Permissions`, `Permission` and `Risk` stay in `@stackra/iam`.
