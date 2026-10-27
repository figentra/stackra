---
"@stackra/iam": minor
---

Add the existence-only query: `ExistenceQueryService.matching(model, where, { limit })` (`./node`) answers which records
of a model match a check (a conflict check, a duplicate search) as existence-only hits (id and model key), reading the
primary key only, counting nothing, at most `limit` hits, under the records the caller may see or only learn exist
(`IamVisibilityFilterDriver.existenceConditionsFor`, `see` or `exists`, followed relations included). Add
`assertFieldsReadable` (`.`): a count, sum or other aggregate over or filtered on a hidden field is refused, so filtered
aggregates apply the same field policy as reads on top of the row policy `CrudService` already ANDs (STA-933).
