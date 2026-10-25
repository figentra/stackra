---
"@stackra/model": minor
---

Add the `Commentable`, `HasAttachments`, `Taggable` and `HasCorrections` traits with `currentRows` (the correction
chain of ADR 0321), `Model.global` and `Model.isGlobal` (ADR 0210 amendment), `ModelAddition` (ADR 0336), the data
classes of ADR 0341 (`DataClass`, `PrivilegedDataClass`, `@Classify` and the four effect enums), and `@Meter` with
`MeterKind` (ADR 0216). `MODEL_KINDS` now includes `model_addition`.
