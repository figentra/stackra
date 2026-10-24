# Tasks: `@stackra/integrations` wave 4

**Input**: `.agents/specs/sta-348-integrations/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-integrations/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/communication/integrations` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `AuthType`, `ConnectionLevel`, `IntegrationCategory`, `RateLimitScope` in `packages/communication/integrations/src/core/enums/` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] `Integration` and its option check in `packages/communication/integrations/src/core/bases/integration.base.ts` and `packages/communication/integrations/src/core/functions/read-integration-options.function.ts` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `Connection`, `ConnectedAccount`, `registerConnections` in `packages/communication/integrations/src/core/bases/connection.base.ts`, `packages/communication/integrations/src/core/values/connected-account.value.ts` and `packages/communication/integrations/src/core/functions/register-connections.function.ts` — covers: FR-004, P-004 — route: package — deps: T004
- [x] T006 [US1] The five refusals in `packages/communication/integrations/src/core/errors/` — covers: FR-002, FR-005 — route: package — deps: T003
- [x] T007 [US3] The managed client, placeholders, JWT signer and token request in `packages/communication/integrations/src/core/functions/` — covers: FR-005, P-005 — route: package — deps: T006
- [x] T008 [US3] `IntegrationRuntime` in `packages/communication/integrations/src/core/services/integration-runtime.service.ts` — covers: FR-007, P-007 — route: package — deps: T007
- [x] T009 [US2] `ConnectionStore`, `ConnectionContext`, `ConnectionHost` in `packages/communication/integrations/src/core/ports/` and the two drivers in `packages/communication/integrations/src/core/drivers/` — covers: FR-006, P-006 — route: package — deps: T008
- [x] T010 [US5] `fakeIntegrationApi`, `makeConnection` and the testing plugin in `packages/communication/integrations/src/testing/` — covers: FR-008, P-008 — route: package — deps: T009
- [x] T011 [US1] Stand-in barrels `packages/communication/integrations/src/core/index.ts` and `packages/communication/integrations/src/testing/index.ts` with their export-list tests — covers: FR-002, P-002 — route: package — deps: T010
- [x] T012 [US1] Tests for every public symbol in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T011
- [x] T013 [US1] Changeset `.changeset/integrations-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001, SC-003 — route: package — deps: T012
- [ ] T014 [US1] Run the package's tests, typecheck (TypeScript 7.0.2 and 6.0.3) and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T012
