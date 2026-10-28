---
"@stackra/model": minor
"@stackra/database": minor
---

Add the native `uuid` storage of public ids (ADR 0135 and 0134, 2026-10-28 amendments): `publicIdToUuid` and
`uuidToPublicId`, the `PublicIdType(prefix)` key column type, `LinkType(model, prefix)` for a `uuid` link column, and
the compiler's `publicIds: "uuid"` option that writes `hasPublicId`, `belongsTo` and `link` columns as `uuid`.
