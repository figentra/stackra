---
"@stackra/iam": minor
"@stackra/gen": patch
---

`MemoryDimensionValuesDriver` is the `memory` candidate of `DimensionValues`: a consuming service projects the values the owning service's events make live (`project`, `retire`); nothing is live until projected. Gen binds the workflow node's `ServiceAckService`, `AutomationService` and `ChecklistService` where a member injects them and registers their model partners, as it does `RuleSetService`.
