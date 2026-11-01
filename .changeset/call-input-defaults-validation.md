---
"@stackra/validation": minor
---

Add `InputFields<T>` and the type-only `~defaults` brand on `Schema` (STA-1694): `InputFields` is `Fields` with the fields
named in `~defaults` optional, recursively for nested shapes, which is what the schema's parse accepts. `Fields` ignores
the brand, so `X$Check` and `X.create` are unchanged.
