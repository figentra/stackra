---
"@stackra/rules": minor
"@stackra/workflow": minor
"@stackra/scope": minor
---

`ConditionField`, `ServiceAckSet` and `ScopeNode` now extend `Model.global(...)`. Their tables hold no tenant data by
design: a field registry, the service acks a workflow waits for, and the scope tree (read outside its package only
through the `ScopeTree` port). Gen no longer warns that these models are neither tenant-owned nor global. The
row-security audit lists their tables as platform tables. Nothing changes at run time.
