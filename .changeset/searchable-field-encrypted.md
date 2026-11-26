---
"@stackra/gen": minor
"@stackra/search": minor
"@stackra/model": patch
---

A field that rests encrypted can no longer reach the search index as plain text (STA-2241). The index reads the loaded
row, which holds a `HasEncryptedFields` field opened, so a `@Searchable` path to one would store its plain text in the
search columns, hand it to the embedder of a `semantic: true` facet and show it in snippets. Gen now refuses
`searchable_field_encrypted` when an own model's text, filter, sortable or range path ends at an encrypted field (its
own, an own base model's, or one reached through a relation to an own model), with a fix that drops the path and points
at `HasEncryptedFields({ lookup })` and `whereEncrypted`. `@stackra/search` refuses the same at runtime with
`refuseEncryptedSearchPath`: `searchDocumentOf` (so indexing and the semantic passage) and `SearchIndex.snippets` throw a
`TypeError` naming `searchable_field_encrypted` before any opened value is read, also for a package model gen could not
see. `HasEncryptedFields`' contract names the refusal. ADR 0465 (decision 5).
