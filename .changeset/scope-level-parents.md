---
"@stackra/scope": minor
---

A scope level may name the levels it sits under: `ScopeLevel.parents` (OS tenancy SPEC gap G9). `childLevelsOf` then offers, in declared order, the parent's own level when it is recursive, every level whose `parents` name the parent, and the next declared level when that level names no `parents`; a configuration without `parents` behaves exactly as before. `ScopeConfig$` refuses a parent that is not a declared level, a level as its own parent unless it is recursive, and an empty list. No migration: a node stores its level as text.
