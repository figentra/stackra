# Tasks: tenancy: a product extends KeyProvider without a DriverRegistry clash

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2693

- [x] T001 drop the port's brand in `packages/foundation/contracts/src/core/ports/key-provider.port.ts` — covers: AC-001, P-001 — route: spec-task
- [x] T002 drop tenancy's entry and list: `packages/security/tenancy/src/core/types/key-provider-driver-names.type.ts`, `packages/security/tenancy/src/core/constants/key-provider-drivers.constant.ts`, the store's entry in `packages/security/tenancy/src/core/types/tenant-data-key-store-driver-names.type.ts`, the open name in `packages/security/tenancy/src/core/constants/tenant-keys-config-schema.constant.ts` and `packages/security/tenancy/src/core/schemas/tenant-keys-options.schema.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task — deps: T001
- [x] T003 the test in `packages/security/tenancy/src/config/__tests__/tenant-keys.config.test.ts` and the changeset `.changeset/key-provider-open.md` — covers: AC-002, AC-003, P-002 — route: spec-task — deps: T002
