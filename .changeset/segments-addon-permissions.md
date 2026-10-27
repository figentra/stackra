---
"@stackra/segments": minor
---

Segments becomes an add-on above `@stackra/iam` and `@stackra/rules` (ADR 0462 decision 1): `SegmentPermissions` with
the system-held `recompute` permission that `RecomputeSegmentsAction` derives (STA-1365 item 9), the `SEGMENT_FACTS`
fact source (`segments.ids`) and `SegmentFactProviderDriver`, which plugs membership into the rules engine. Lang keys
for the fact label in the seven locales.
