---
"@stackra/runway": minor
---

Add the edition sections of ADR 0335: the root runway's `product` (the product key and, for an edition, `edition.of`
and its version range) and an app member's `brands` (key, name, tokens overlay path, app and bundle ids), in the zod
schemas and the published JSON schemas. `definesFor` carries both into the bundle's facts, and `productOf()` and
`brandsOf(member)` read them.
