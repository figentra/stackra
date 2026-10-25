---
"@stackra/tenancy": minor
---

Add sandbox tenants (`TenantEnvironment`, `SandboxTenantService`, the `SandboxTenants` port and its memory driver; a
membership may carry `environment`) and consented cross-tenant shares from ADR 0343 (`TenantShareService` with
propose, accept, decline, revoke, `flows` and cross-region `release` under the `TransferCheck` port, `revocationPlan`,
the `TenantShares` port and its memory driver, and the `ShareTransitionInvalidError`, `TransferRefusedError` and
`SandboxNotFoundError` refusals).
