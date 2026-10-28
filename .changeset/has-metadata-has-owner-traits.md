---
"@stackra/database": minor
"@stackra/iam": minor
---

Add the `HasMetadata` and `HasOwner` traits (ADR 0321 d4, data-layer gap mo18). `@stackra/database` exports
`HasMetadata` (a `metadata` bag of string keys to string values, at most 16 KB), the blueprint's `t.metadata()` (with an
optional GIN index), `MetadataSubscriber` and `MetadataInvalidError`; `CrudService` checks metadata on every write.
`@stackra/iam/node` exports `HasOwner` (`ownerId`, the owner or assignee) and `OwnerMacro` (`t.owner()`).
