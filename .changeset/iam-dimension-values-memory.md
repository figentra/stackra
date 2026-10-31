---
"@stackra/iam": minor
"@stackra/gen": patch
---

`MemoryDimensionValuesDriver` is the `memory` candidate of `DimensionValues`: a consuming service projects the values the owning service's events make live (`project`, `retire`); nothing is live until projected. Gen binds `ServiceAckService` where a member injects it and registers its `ServiceAckSet` partner, as it does `RuleSetService`.
