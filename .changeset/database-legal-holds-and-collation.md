---
"@stackra/database": minor
---

Add the legal-hold seam of ADR 0134 (2026-10-24 amendment): the `HoldRegistry` port and `Disposal` enum in
`./contracts`, and `connectHoldRegistry`, `disposableIds`, `HoldSubscriber` (refuses a unit-of-work delete of a held
row) and `RecordHeldError` in `.`; `CrudService.purge` now removes only the rows no hold covers. Add ICU collations:
`schema.createCollation(name, locale)` and `.collate(name)` on a text column, for Arabic sorting.

Add `visibleKeysQuery(model)`, the parameterised subquery of the keys the caller may see, so a raw-SQL read path such
as search applies record visibility before it ranks.
