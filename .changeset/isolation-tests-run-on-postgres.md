---
"@stackra/repo-checks": patch
"@stackra/flow-preset": patch
---

Tenant isolation tests must run on real Postgres. PGlite, the memory database driver and the test container's
superuser all skip row-level security, so a unit test that "tenant B cannot read tenant A" passes even when the
policies are wrong.

- `stackra validate --repository` has a new check, `isolation-tier`: a test that imports `assertRowSecurity` or
  `tenantIsolationOptions` from `@stackra/database/testing` or `@stackra/tenancy/testing` must be a `.int.test.ts`.
- The tenancy rule gains point 8: an isolation test runs in `test:int` on Postgres, as the service role that cannot
  bypass row-level security, with each read inside `TenantIsolationService.withTenant`.
- The preset ships the `security-tenancy-isolation-test` skill again, rewritten with a working example.
