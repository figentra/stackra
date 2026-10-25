# Tasks: `@stackra/shipping`

**Input**: `.agents/specs/sta-348-shipping/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 ADR 0369 (Proposed) in `apps/docs/src/adr/` — covers: SC-001 — route: docs
- [x] T003 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) — covers: FR-001 — route: package
- [x] T004 Contracts: enums, `CarrierGateways`, gateway interfaces, request and result types — covers: FR-002, FR-003, FR-004 — route: package
- [x] T005 Core: `hasCapability`, `normaliseTracking`, `labelDocument`, `batchZpl`, `dimensionalWeight`, `chargeableWeight`, two refusals — covers: FR-002 to FR-007 — route: package
- [x] T006 Tests for every public symbol and each barrel — covers: SC-002 — route: tests
- [x] T007 Changeset `.changeset/shipping-package.md` — covers: SC-001 — route: package
- [ ] T008 Integrator: install, add ADR 0369 to the index — route: integrator
- [ ] T009 Run tests, typecheck, lint, format and build in the testing workflow — covers: SC-002, SC-003 — route: tests
