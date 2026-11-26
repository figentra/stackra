# Tasks: a per-tenant KeyProvider a container can bind

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2673

- [x] T001 the data key store port, model, migration and drivers, with the integration test, in `packages/security/tenancy/src/contracts/ports/tenant-data-key-store.port.ts`, `packages/security/tenancy/src/node/models/tenant-data-key.model.ts`, `packages/security/tenancy/src/node/database/migrations/0002-create-tenant-data-keys.migration.ts`, `packages/security/tenancy/src/node/drivers/postgres-tenant-data-key-store.driver.ts` — covers: AC-004, P-004 — route: spec-task
- [x] T002 the KeyProvider drivers, cache, config and event, with their tests, in `packages/security/tenancy/src/node/drivers/kms-key-provider.driver.ts`, `packages/security/tenancy/src/node/drivers/ephemeral-key-provider.driver.ts`, `packages/security/tenancy/src/core/values/tenant-key-cache.value.ts`, `packages/security/tenancy/src/core/events/tenant-data-key-minted.event.ts` — covers: AC-001, AC-002, AC-003, AC-005, P-001, P-002, P-003, P-005 — route: spec-task — deps: T001
- [x] T003 the manifest, ADR 0188 and the changeset in `packages/security/tenancy/stackra.manifest.json`, `apps/docs/src/docs/adr/0188-operator-access-and-the-encryption-key-hierarchy.mdx`, `.changeset/tenancy-tenant-key-provider.md` — covers: AC-001 — route: spec-task — deps: T002
