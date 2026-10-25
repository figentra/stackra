# Tasks: `@stackra/pricing` wave 2

**Input**: `.agents/specs/sta-348-pricing/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-pricing/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/commerce/pricing` — covers: FR-001, FR-006 — route: package — deps: T001
- [x] T003 [US1] `PricePoint` — covers: FR-003, P-001 — route: package — deps: T002
- [x] T004 [US2] `PriceTier` and `GraduatedPrice` — covers: FR-004, P-002 — route: package — deps: T002
- [x] T005 Stand-in barrel `packages/commerce/pricing/src/core/index.ts` — covers: FR-002, FR-005 — route: package — deps: T003, T004
- [x] T006 Tests beside every subject and the barrel test — covers: SC-001, SC-002, SC-003, FR-007 — route: tests — deps: T005
- [x] T007 Changeset `.changeset/pricing-package.md` — covers: SC-001 — route: package — deps: T005
- [ ] T008 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T006
