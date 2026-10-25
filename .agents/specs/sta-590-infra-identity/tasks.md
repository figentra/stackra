# Tasks: `@stackra/infra-identity`

**Input**: `.agents/specs/sta-590-infra-identity/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-590-infra-identity/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/infrastructure/infra-identity` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `IdentityAppKind`, `InstanceRole`, `IdentityInfraInvalidError`, the seed and provider schemas and the seed and plan types in `packages/infrastructure/infra-identity/src/core/` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `parseIdentitySeed` and `identityPlan` in `packages/infrastructure/infra-identity/src/core/functions/` — covers: FR-002, FR-003, FR-004, P-002, P-003, P-004 — route: infra — deps: T003
- [x] T005 [US1, US2] `readIdentitySeed`, `identityStack` and `IdentityStack` in `packages/infrastructure/infra-identity/src/node/` — covers: FR-005, FR-006, FR-007, P-005, P-006, P-007 — route: infra — deps: T004
- [x] T006 [US1, US2] Tests beside every public symbol (`packages/infrastructure/infra-identity/src/**/__tests__/`), the slice under Pulumi mocks — covers: SC-002 — route: tests — deps: T005
- [x] T007 [US1] Changeset `.changeset/infra-identity-package.md` — covers: SC-001 — route: package — deps: T005
- [ ] T008 [US1, US2] Run the package's tests, typecheck and build in the separate testing workflow, once `@pulumi/pulumi` and `@pulumiverse/zitadel` are in the `infra` catalog — covers: SC-003 — route: tests — deps: T006
