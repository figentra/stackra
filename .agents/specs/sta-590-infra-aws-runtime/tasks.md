# Tasks: `@stackra/infra-aws-runtime`

**Input**: `.agents/specs/sta-590-infra-aws-runtime/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-590-infra-aws-runtime/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/infrastructure/infra-aws-runtime` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] `runtimePlan`, `resourceName`, `cacheNodeType`, the node table and the plan types in `packages/infrastructure/infra-aws-runtime/src/core/` — covers: FR-002, FR-004, FR-005, FR-006, FR-007, FR-008 — route: package — deps: T002
- [x] T004 [US1, US2] `readRuntimePlan` and `awsRuntime` with their types in `packages/infrastructure/infra-aws-runtime/src/node/` — covers: FR-003, FR-009 — route: package — deps: T003
- [x] T005 [US1, US2] Tests beside every public symbol, the program under Pulumi's mocks (`packages/infrastructure/infra-aws-runtime/src/**/__tests__/`) — covers: SC-001, P-001, P-002, P-003, P-004, P-005, P-006, P-007, P-008, P-009 — route: tests — deps: T004
- [x] T006 [US1] Changeset `.changeset/infra-aws-runtime-package.md` — covers: SC-001 — route: package — deps: T004
- [ ] T007 [US1, US2] Run the package's tests, typecheck and build in the separate testing workflow, once `catalog:infra` holds `@pulumi/aws` and `@pulumi/pulumi` — covers: SC-002 — route: tests — deps: T005
