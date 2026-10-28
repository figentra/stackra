---
"@stackra/model": minor
"@stackra/ai": minor
---

Bind encrypted fields to the scope that owns the row (gap gov8, ADR 0476). `HasEncryptedFields({ scope: "tenantId" },
...fields)` seals and opens each value in `<model key>.<field>@<scope id>`, so a value copied into another scope's row
does not open; the subscriber and `EncryptedFieldsResealService` read the id from the row and refuse a row without
one, and `encryptedScopeOf` reads the option. `@stackra/ai`'s `Message` now declares its content this way, and
`ScopeKeyCast` is removed from `@stackra/ai/node`: `PostgresConversationStoreDriver` takes only its two repositories.
