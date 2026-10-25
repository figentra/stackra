# Tasks: `@stackra/infra-gcp`

**Input**: `.agents/specs/sta-348-infra-gcp/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-infra-gcp/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/infrastructure/infra-gcp` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] Runway schema, `gcpBaselineConfig`, `costLabels` and types in `packages/infrastructure/infra-gcp/src/core/` — covers: FR-002 — route: infra — deps: T002
- [x] T004 [US1] `resolveRef`, `cloudProjectOf`, `projectProvider`, `dataKey`, `filesBucket`, `serviceAccountId`, `ciAccess`, `costControls` in `packages/infrastructure/infra-gcp/src/node/functions/` — covers: FR-003 to FR-007 — route: infra — deps: T003
- [x] T005 [US1] `gcpBaseline` in `packages/infrastructure/infra-gcp/src/node/functions/gcp-baseline.function.ts` — covers: FR-003 — route: infra — deps: T004
- [x] T006 [US1] `mockPulumi` and `outputOf` in `packages/infrastructure/infra-gcp/src/testing/` — covers: FR-007 — route: tests — deps: T002
- [x] T007 [US1] Tests beside every public symbol (`packages/infrastructure/infra-gcp/src/**/__tests__/`) — covers: SC-001 — route: tests — deps: T005, T006
- [x] T008 [US1] Changeset `.changeset/infra-gcp-package.md` — covers: FR-001 — route: package — deps: T005
- [ ] T009 [US1] Add `@pulumi/gcp` to the `infra` catalog and install (integrator) — covers: FR-001 — route: package — deps: T002
- [ ] T010 [US1] Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T007, T009
