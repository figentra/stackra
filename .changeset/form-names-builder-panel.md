---
"@stackra/builder": minor
"@stackra/panel": minor
---

Unique form names (STA-1383). The two form models are different things (a tenant-built form a respondent fills, and
an admin resource form), so they keep separate shapes with separate names. Breaking renames:

- `@stackra/builder`: the form document types `FormField` and `FormStep` are `FormDocumentField` and
  `FormDocumentStep` (its `visibleFields`, the respondent's conditional fields, keeps its name).
- `@stackra/panel`: `visibleFields(fields, mode)` is `fieldsForMode(fields, mode)` (`FormField` and `FormStep`, the
  resource form builders, keep their names).
