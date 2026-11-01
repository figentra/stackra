---
"@stackra/gen": patch
---

A settings section (a schema-typed field with no initializer) is emitted `.prefault(() => ({}))` in `#stackra/schemas`,
so a group with no stored value for a section reads that section's field defaults instead of throwing a ZodError. A
wrong-typed stored value is still refused. Run `stackra gen` to regenerate.
