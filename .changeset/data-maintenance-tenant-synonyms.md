---
"@stackra/data-maintenance": minor
---

Add the tenant's search synonyms (STA-1636, ADR 0492 decision 5), moved here from `@stackra/search` to keep search below
`@stackra/iam`: the `Synonym` model (`data_maintenance.synonyms`, migration 0001, `BelongsToTenant`, forced RLS),
`SynonymPermissions`, `SynonymService`, the `data_maintenance.synonym.create`, `.update` and `.delete` actions, the
`data_maintenance.synonym.list` query, and `DatabaseSynonymSourceDriver`, which implements search's `SynonymSource`. Texts
in `assets/lang` for ar, de, en, es, fr, it and nl. New workspace dependencies: `@stackra/errors`, `@stackra/model` and
`@stackra/tenancy`.
