---
"@stackra/database": patch
---

An `equals` or `equalsOrUnset` row-level-security policy on a `uuid` column now decodes a public-id setting
(`scp_…`, as `withTenant` writes it) to the UUID it encodes, so a tenant table compiled with `publicIds: "uuid"` no
longer raises on every query; a raw UUID setting is still cast as it is, and text columns are unchanged.
