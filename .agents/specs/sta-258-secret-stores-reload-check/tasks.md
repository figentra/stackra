---
description: "Tasks for STA-258: Google and file secret stores, reload on rotation, and the names check before a deploy"
---

# Tasks: Google and file secret stores, reload on rotation, and the names check before a deploy

**Input**: Design documents from `.agents/specs/sta-258-secret-stores-reload-check/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - loading stores

- [x] T001 `secretEntriesOf`, shared by the AWS driver, in `packages/foundation/config/src/core/functions/secret-entries-of.function.ts` and `packages/foundation/config/src/node/drivers/aws-secrets-manager-secret-store.driver.ts` — covers: FR-004, AC-008 — route: spec-task
- [x] T002 `LoadableSecretStore`, `SecretReload`, `SecretReloadOptions` and `scheduleSecretReload` in `packages/foundation/config/src/core/types/loadable-secret-store.type.ts`, `packages/foundation/config/src/core/types/secret-reload.type.ts`, `packages/foundation/config/src/core/types/secret-reload-options.type.ts` and `packages/foundation/config/src/core/functions/schedule-secret-reload.function.ts` — covers: FR-005, AC-003, P-001, P-002 — route: spec-task
- [x] T003 driver names in `packages/foundation/config/src/core/constants/secret-store-drivers.constant.ts`, `packages/foundation/config/src/core/types/secret-store-driver-names.type.ts`, `packages/foundation/config/src/core/constants/secrets-config-schema.constant.ts` and `packages/foundation/config/src/core/schemas/secrets-options.schema.ts` — covers: FR-006, AC-006 — route: spec-task

## Phase 2: User Story 3 - Google Cloud and on-premises stores (Priority: P2)

- [x] T004 [US3] the Google driver and config in `packages/foundation/config/src/node/drivers/gcp-secret-manager-secret-store.driver.ts`, `packages/foundation/config/src/config/gcp-secret-manager.config.ts`, `packages/foundation/config/src/core/schemas/gcp-secret-manager-options.schema.ts` and `packages/foundation/config/src/core/constants/gcp-secret-manager-config-schema.constant.ts` — covers: FR-001, FR-003, NFR-001, NFR-002, AC-004 — route: spec-task — deps: T001
- [x] T005 [US3] the `file` driver and config in `packages/foundation/config/src/node/drivers/file-secret-store.driver.ts`, `packages/foundation/config/src/config/secret-files.config.ts`, `packages/foundation/config/src/core/schemas/secret-files-options.schema.ts` and `packages/foundation/config/src/core/constants/secret-files-config-schema.constant.ts` — covers: FR-002, FR-003, AC-005 — route: spec-task
- [x] T006 [US3] barrels and the generated manifest in `packages/foundation/config/src/core/index.ts`, `packages/foundation/config/src/node/index.ts` and `packages/foundation/config/stackra.manifest.json` — covers: AC-006 — route: spec-task — deps: T004, T005
- [x] T007 [US3] tests in `packages/foundation/config/src/node/drivers/__tests__/gcp-secret-manager-secret-store.driver.test.ts`, `packages/foundation/config/src/node/drivers/__tests__/file-secret-store.driver.test.ts`, `packages/foundation/config/src/config/__tests__/gcp-secret-manager.config.test.ts`, `packages/foundation/config/src/config/__tests__/secret-files.config.test.ts`, `packages/foundation/config/src/config/__tests__/secrets.config.test.ts`, `packages/foundation/config/src/core/__tests__/index.test.ts` and `packages/foundation/config/src/node/__tests__/index.test.ts` — covers: FR-001, FR-002, FR-003, FR-006, AC-004, AC-005, AC-006, SC-002 — route: tests — deps: T006

## Phase 3: User Story 2 - Reload on rotation (Priority: P2)

- [x] T008 [US2] tests in `packages/foundation/config/src/core/functions/__tests__/schedule-secret-reload.function.test.ts` and `packages/foundation/config/src/core/functions/__tests__/secret-entries-of.function.test.ts` — covers: FR-004, FR-005, AC-003 — route: tests — deps: T002

## Phase 4: User Story 1 - The names check before a deploy (Priority: P1)

- [x] T009 [US1] optional names and placeholders in `packages/developer/runway/src/node/types/deploy-runways.type.ts`, `packages/developer/runway/src/node/functions/read-runways.function.ts`, `packages/developer/runway/src/node/types/deploy-plan.type.ts`, `packages/developer/runway/src/node/functions/deploy-plan.function.ts`, `packages/developer/runway/src/node/types/secret-sync-entry.type.ts` and `packages/developer/runway/src/node/functions/secret-sync-plan.function.ts` — covers: FR-007, FR-009, AC-009, P-003 — route: spec-task
- [x] T010 [US1] placeholders in the reader and the sync in `packages/developer/runway/src/node/functions/read-member-secrets.function.ts` and `packages/developer/runway/src/node/functions/sync-secrets.function.ts` — covers: FR-010, FR-011, AC-002, P-004 — route: spec-task — deps: T009
- [x] T011 [US1] `runway env missing` in `packages/developer/runway/src/node/functions/env-missing.function.ts`, `packages/developer/runway/src/node/commands/runway-env-missing.command.ts` and `packages/developer/runway/src/node/constants/runway-commands.constant.ts` — covers: FR-008, AC-001, AC-002 — route: spec-task — deps: T009
- [x] T012 [US1] the action's header in `.github/actions/secrets-decrypt/action.yml` — covers: FR-012, AC-007 — route: spec-task — deps: T011
- [x] T013 [US1] tests in `packages/developer/runway/src/node/functions/__tests__/env-missing.function.test.ts`, `packages/developer/runway/src/node/commands/__tests__/runway-env-missing.command.test.ts`, `packages/developer/runway/src/node/functions/__tests__/sync-secrets.function.test.ts` and `packages/developer/runway/src/node/functions/__tests__/deploy-plan.function.test.ts` — covers: FR-007, FR-008, FR-009, FR-010, FR-011, AC-001, AC-002 — route: tests — deps: T010, T011

## Phase 5: Polish

- [x] T014 [P] ADR 0371 amendment, the command page, runbooks, nav, READMEs and AGENTS.md in `apps/docs/src/docs/adr/0371-secret-store-drivers-which-deploy-mode-binds-which-and-how-the-bootstrap-credential-arrives.mdx`, `apps/docs/src/docs/runway/env-missing.mdx`, `apps/docs/src/docs/runbooks/secrets.mdx`, `apps/docs/src/docs/runbooks/runway.mdx`, `apps/docs/src/config/docs.config.ts`, `packages/foundation/config/README.md`, `packages/foundation/config/AGENTS.md` and `packages/developer/runway/README.md` — covers: AC-006 — route: steward-docs — deps: T012
- [x] T015 [P] changesets for `packages/foundation/config` and `packages/developer/runway` in `.changeset/secret-stores-reload.md` and `.changeset/runway-env-missing.md`, the generated `packages/developer/runway/stackra.manifest.json` — covers: AC-006 — route: steward-changesets — deps: T012

## Phase 6: Review findings

- [x] T016 [US1] keep a value Encore holds: `encoreHeldSecrets` and the guard in `packages/developer/runway/src/node/functions/encore-held-secrets.function.ts` and `packages/developer/runway/src/node/functions/sync-secrets.function.ts`, tests in `packages/developer/runway/src/node/functions/__tests__/encore-held-secrets.function.test.ts` and `packages/developer/runway/src/node/functions/__tests__/sync-secrets.function.test.ts` — covers: FR-011, AC-002 — route: spec-task — deps: T010
- [x] T017 [US1] the names check inside the decrypt in `packages/developer/runway/src/node/functions/scope-missing.function.ts` and `packages/developer/runway/src/node/commands/runway-secrets-decrypt.command.ts`, tests in `packages/developer/runway/src/node/functions/__tests__/scope-missing.function.test.ts` and `packages/developer/runway/src/node/commands/__tests__/runway-secrets-decrypt.command.test.ts` — covers: FR-012, AC-007 — route: spec-task — deps: T011
- [x] T018 [US2] no `reloadSeconds` until boot reads it in `packages/foundation/config/src/core/schemas/secrets-options.schema.ts` and `packages/foundation/config/src/core/constants/secrets-config-schema.constant.ts`, test in `packages/foundation/config/src/config/__tests__/secrets.config.test.ts` — covers: FR-006, AC-010 — route: spec-task — deps: T003
