---
"@stackra/gen": minor
"@stackra/database": minor
"@stackra/tenancy": minor
---

Row-level security conformance (stackra-258). `@stackra/database/testing` adds `assertRowSecurity` (every table
holding the owner column has forced row-level security and its `pol_<table>_<column>` policy, the service role does
not bypass it, and a rolled-back two-owner probe sees and moves nothing) and `usePostgres({ migrationsDirectory })`.
`@stackra/tenancy/testing` adds `tenantIsolationOptions()`. Gen refuses a service model that is neither owned nor
`Model.global` (`model_tenancy_missing`), records `global` on manifest models, and writes
`.stackra/tests/tenant-isolation.int.test.ts` for a service with owned models.
