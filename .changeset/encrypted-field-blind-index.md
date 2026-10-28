---
"@stackra/model": minor
---

Look up an encrypted field by equal value (gap gov9). `HasEncryptedFields({ lookup: ["email"] }, "email")` makes
`EncryptedFieldsSubscriber` write a blind index, an HMAC of the plain text under a key derived from the scope's data
key, to the model's `emailBidx` property on each seal; `whereEncrypted(em, keys, Lead, "email", value)` builds the
matching filter and `encryptedLookupOf` reads the lookup fields. The subscriber takes the scope's `KeyProvider` as a
new optional third argument, required once a model has lookup fields. `EncryptedFieldsResealService` rewrites the
index with its value and backfills a missing one. `EncryptedFieldsOptions.subject` is now optional, and `lookup`
cannot be combined with `subject`.
