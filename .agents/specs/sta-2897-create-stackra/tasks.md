---
description: "Tasks for STA-2897: create-stackra, the npm initializer, and one documented install line"
---

# Tasks: `create-stackra`, the npm initializer, and one documented install line

**Input**: Design documents from `.agents/specs/sta-2897-create-stackra/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - the unscoped member

- [x] T001 `UNSCOPED_PACKAGES` and `expectedName` in `packages/developer/repo-checks/src/node/constants/unscoped-packages.constant.ts`, `packages/developer/repo-checks/src/node/functions/expected-name.function.ts` and `packages/developer/repo-checks/src/node/index.ts` — covers: FR-007, AC-006, P-005 — route: spec-task
- [x] T002 test: the one unscoped member in `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts` — covers: FR-007, AC-006 — route: tests — deps: T001

## Phase 2: User Story 1 - One command on a clean machine (Priority: P1)

**Goal**: `create-stackra` runs `stackra create` with the `@stackra` scope mapped for one run.

**Independent Test**: `run-create-stackra.function.test.ts` and the Linux proof.

- [x] T003 [US1] the member in `packages/developer/create-stackra/package.json`, `packages/developer/create-stackra/tsdown.config.ts`, `packages/developer/create-stackra/vitest.config.ts`, `packages/developer/create-stackra/tsconfig.json`, `packages/developer/create-stackra/turbo.jsonc`, `packages/developer/create-stackra/stackra.config.ts`, `packages/developer/create-stackra/stackra.manifest.json`, `packages/developer/create-stackra/LICENSE`, `packages/developer/create-stackra/CHANGELOG.md` and `knip.jsonc` — covers: FR-001, FR-008, NFR-001, AC-007 — route: spec-task — deps: T001
- [x] T004 [US1] the run in `packages/developer/create-stackra/src/node/create-stackra.ts`, `packages/developer/create-stackra/src/node/functions/run-create-stackra.function.ts`, `packages/developer/create-stackra/src/node/functions/parse-bootstrap-args.function.ts`, `packages/developer/create-stackra/src/node/functions/bootstrap-registry.function.ts`, `packages/developer/create-stackra/src/node/functions/npx-command.function.ts`, `packages/developer/create-stackra/src/node/functions/npx-arguments.function.ts`, `packages/developer/create-stackra/src/node/functions/manual-line.function.ts`, `packages/developer/create-stackra/src/node/functions/exit-code.function.ts` and `packages/developer/create-stackra/src/node/constants/process-host.constant.ts` — covers: FR-002, FR-003, FR-004, FR-005, NFR-002, AC-001, AC-003, AC-004, P-001, P-003 — route: spec-task — deps: T003
- [x] T005 [US1] the constants, error and types in `packages/developer/create-stackra/src/node/constants/min-node-major.constant.ts`, `packages/developer/create-stackra/src/node/constants/stackra-cli-package.constant.ts`, `packages/developer/create-stackra/src/node/constants/stackra-registry-default.constant.ts`, `packages/developer/create-stackra/src/node/constants/usage.constant.ts`, `packages/developer/create-stackra/src/node/errors/bootstrap-usage.error.ts`, `packages/developer/create-stackra/src/node/types/bootstrap-args.type.ts`, `packages/developer/create-stackra/src/node/types/bootstrap-env.type.ts`, `packages/developer/create-stackra/src/node/types/bootstrap-host.type.ts` and `packages/developer/create-stackra/src/node/types/npx-command.type.ts` — covers: FR-003, FR-004, AC-003, AC-004 — route: spec-task — deps: T003
- [x] T006 [US1] tests in `packages/developer/create-stackra/src/node/functions/__tests__/run-create-stackra.function.test.ts`, `packages/developer/create-stackra/src/node/functions/__tests__/parse-bootstrap-args.function.test.ts`, `packages/developer/create-stackra/src/node/functions/__tests__/bootstrap-registry.function.test.ts`, `packages/developer/create-stackra/src/node/functions/__tests__/npx-command.function.test.ts`, `packages/developer/create-stackra/src/node/functions/__tests__/manual-line.function.test.ts`, `packages/developer/create-stackra/src/node/functions/__tests__/exit-code.function.test.ts` and `packages/developer/create-stackra/src/node/constants/__tests__/process-host.constant.test.ts` — covers: FR-002, FR-003, FR-004, FR-005, AC-001, AC-002, AC-003, AC-004, SC-002 — route: tests — deps: T004, T005
- [x] T007 [US1] the end-to-end run in `stackra-demo` on a Linux build machine with an empty `HOME` against the real registry, for `packages/developer/create-stackra/src/node/create-stackra.ts` and the documented line — covers: SC-001, AC-007 — route: tests — deps: T004

## Phase 3: User Story 2 - Another Stackra registry (Priority: P2)

**Goal**: the registry chosen for the run reaches the new app's `.npmrc`.

**Independent Test**: `create.test.ts` and `create.command.test.ts`.

- [x] T008 [US2] `registry` in `packages/developer/cli/src/node/create/types/starter-options.type.ts`, `packages/developer/cli/src/node/create/functions/starter-files.function.ts` and `packages/developer/cli/src/node/commands/create.command.ts` — covers: FR-006, AC-005, P-002, P-004 — route: spec-task
- [x] T009 [US2] tests in `packages/developer/cli/src/node/create/functions/__tests__/create.test.ts` and `packages/developer/cli/src/node/commands/__tests__/create.command.test.ts` — covers: FR-006, AC-002, AC-005 — route: tests — deps: T008

## Phase 4: The npmjs member's repository

- [x] T010 `NPMJS_REPOSITORY` in `packages/developer/repo-checks/src/node/constants/npmjs-repository.constant.ts`, `packages/developer/repo-checks/src/node/functions/npm-metadata-for.function.ts` and `packages/developer/repo-checks/src/node/functions/check-member-files.function.ts`, and the URLs of the stackra-inc repository in `packages/developer/create-stackra/package.json` — covers: FR-010, AC-008, P-006 — route: spec-task — deps: T001, T003
- [x] T011 tests in `packages/developer/repo-checks/src/node/functions/__tests__/check-member-metadata.function.test.ts` and `packages/developer/repo-checks/src/node/functions/__tests__/repository-checks.test.ts` — covers: FR-010, AC-008, SC-002 — route: tests — deps: T010

## Phase 5: Polish

- [x] T012 [P] ADR 0199 amendment, the ADR index row and the one install line in `apps/docs/src/docs/adr/0199-developer-experience-create-stackra-app-upgrades-stackra-dev-and-docs.mdx`, `apps/docs/src/docs/adr/index.mdx`, `apps/docs/src/docs/customers/install.mdx`, `packages/developer/create-stackra/README.md` and `packages/developer/create-stackra/AGENTS.md` — covers: FR-009, AC-009 — route: steward-docs — deps: T004
- [x] T013 [P] the architecture map in `apps/docs/scripts/architecture-map/architecture-map.yaml` and `apps/docs/src/assets/architecture-map.html` — covers: FR-001, AC-006 — route: steward-docs — deps: T003
- [x] T014 [P] changesets for the cli and repo-checks packages in `.changeset/create-stackra-registry.md` and `.changeset/repo-checks-npmjs-repository.md` — covers: FR-006, FR-007, FR-010, AC-005, AC-006, AC-008 — route: steward-changesets — deps: T001, T008, T010
