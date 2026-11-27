# Tasks: actions, gen: an action fails closed when no AuditTrail is bound in a deployed environment

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-1571

## Phase 1: the pipeline's audit check (User Stories 1 and 2)

- [x] T001 add `AuditConfig` and its schema over the closed list, with no default: `packages/application/actions/src/config/audit.config.ts`, `packages/application/actions/src/core/constants/audit-config-schema.constant.ts`, `packages/application/actions/src/core/schemas/audit-options.schema.ts`, the exports in `packages/application/actions/src/core/index.ts` and the rows in `packages/application/actions/stackra.manifest.json` — covers: FR-003, AC-005, P-003 — route: package
- [x] T002 refuse a command action with no trail in a deployed environment, taking the environment from the config or the one reader, in `packages/application/actions/src/core/services/action-pipeline.service.ts` (`trail()`, `environment()`) — covers: FR-001, FR-002, FR-004, FR-005, AC-001, AC-002, AC-003, AC-004, AC-006, P-001, P-002, P-004 — route: package — deps: T001
- [x] T003 tests `packages/application/actions/src/config/__tests__/audit.config.test.ts`, `packages/application/actions/src/core/services/__tests__/action-pipeline.audit.test.ts` and `packages/application/actions/src/core/__tests__/index.test.ts` — covers: AC-001, AC-002, AC-003, AC-004, AC-005, AC-006, P-001, P-002, P-003, P-004 — route: package — deps: T002

- [x] T010 drop what the first version of #1095 added and STA-2844 replaces: remove the first version's unaudited-environments constant from the actions package and its runtime-environment host constant, provider, reader and type from the app package's server folder (none of them is on `main`, so the diff no longer holds them), and restore `packages/runtime/app/README.md` — covers: FR-002, AC-002 — route: package — deps: T002

## Phase 2: the generated wiring and the gen refusals

- [x] T004 bind `AuditConfig` where an action runs: `packages/developer/gen/src/core/functions/pipeline-ports.function.ts`, `packages/developer/gen/src/core/constants/gen-reached-ports.constant.ts` — covers: FR-006, AC-007, P-005 — route: gen — deps: T001
- [x] T005 refuse a v2 service that runs the app package and an installed app package below the floor: `packages/developer/gen/src/core/constants/app-environment-floor.constant.ts`, `packages/developer/gen/src/core/functions/check-server-environment.function.ts`, `packages/developer/gen/src/core/functions/runs-server-app.function.ts`, `packages/developer/gen/src/core/functions/emit-encore-environment.function.ts`, `packages/developer/gen/src/core/functions/generate-member.function.ts`, `packages/developer/gen/src/node/functions/generator-version.function.ts`, `packages/developer/gen/src/node/functions/generate.function.ts` — covers: FR-007, FR-008, AC-008, AC-009, P-006, P-007 — route: gen
- [x] T006 tests: `packages/developer/gen/src/core/functions/__tests__/pipeline-ports.function.test.ts`, `packages/developer/gen/src/core/functions/__tests__/check-server-environment.function.test.ts`, `packages/developer/gen/src/node/functions/__tests__/generator-version.function.test.ts`, `packages/developer/gen/src/node/functions/__tests__/generate.function.test.ts`, `packages/developer/gen/src/node/__tests__/golden.test.ts` — covers: AC-007, AC-008, AC-009, P-005, P-006, P-007 — route: gen — deps: T004, T005
- [x] T007 regenerate the pipeline-ports golden (the `AuditConfig` row in the wiring and its input manifest): `packages/developer/gen/__golden__/pipeline-ports/expected/services/shop/.stackra/gen/wiring.ts.golden`, `packages/developer/gen/__golden__/pipeline-ports/input/_modules/@stackra/actions/stackra.manifest.json.golden` — covers: AC-007, P-005 — route: gen — deps: T004

## Phase 3: docs and release

- [x] T008 ADR 0212 note, customer security page, READMEs and changesets: `apps/docs/src/docs/adr/0212-audit-evidence-access-logs-hash-chain-and-retention.mdx`, `apps/docs/src/docs/customers/security.mdx`, `packages/application/actions/README.md`, `packages/developer/gen/README.md`, `.changeset/actions-audit-fails-closed.md`, `.changeset/gen-binds-audit-config.md`, `.changeset/gen-server-environment-refusals.md` — covers: AC-001, AC-008, AC-009 — route: spec-task — deps: T003, T006, T007
- [x] T009 this spec, reworked onto STA-2844: `.agents/specs/sta-1571-audit-fail-closed/spec.md`, `.agents/specs/sta-1571-audit-fail-closed/plan.md`, `.agents/specs/sta-1571-audit-fail-closed/tasks.md` — covers: AC-001 — route: spec-task — deps: T008
