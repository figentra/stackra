---
"@stackra/iam": minor
---

`actors.customer()` and `actors.staff()` from `@stackra/iam/testing` now act in a test tenant by default: the new export `TEST_SCOPE_ID`, a fixed `scp_` id. A call through the pipeline then has a tenant and can write a tenant-owned row. Before, a test actor carried no scope, and `BelongsToTenant` writes failed with "Value for <Model>.tenantId is required" (about 23 os services).

To use another tenant, pass `actors.staff(id, { scopeId })`. For a platform call at the root, pass `{ scopeId: null }`. Service, job, system and anonymous actors still carry no scope; a service claims a tenant through `onBehalfOf`.
