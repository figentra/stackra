---
"@stackra/gen": patch
---

Gen reads `@Setting({ scopes, lockable, approval })` field options again. `Setting` returns `FieldDecorator<unknown>`, which the facet reader did not recognise, so generated setting keys carried only their class scopes and no `approval` or `lockable`.
