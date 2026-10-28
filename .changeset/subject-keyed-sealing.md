---
"@stackra/model": minor
"@stackra/privacy": minor
---

Seal a subject's fields under that subject's own key, so an erasure that shreds them is real (gap gov2).
`HasEncryptedFields({ subject: "userId" }, ...fields)` makes `EncryptedFieldsSubscriber` seal and open each row with
the new `SubjectCipherResolver` port, and an erased subject's fields load as null. `@stackra/privacy` adds
`SaltedSubjectCipherResolverDriver`, the `PostgresSubjectSaltStoreDriver` over the new `privacy.subject_salts` table
(migration 0001, partitioned per tenant), and `unsealedShredFields`. `EraseSubjectWorkflow` now refuses to erase while
a `Shred` field is not subject-sealed. `SubjectSaltStore` gains `find` and `obtain`, so custom drivers must implement
both.
