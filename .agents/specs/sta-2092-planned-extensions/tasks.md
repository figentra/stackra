---
description: "Tasks for STA-2092: planned Postgres extensions are created before migrations on AWS and GCP"
---

# Tasks: planned Postgres extensions are created before migrations on AWS and GCP

**Input**: Design documents from `.agents/specs/sta-2092-planned-extensions/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The list and the script

**Goal**: `@stackra/runway` gives the extensions a server must hold and the script that creates them.

- [x] T001 Test first: the union, the member filter, no database block; the script per database, the stop on failure, an empty list and an unapproved name in `packages/developer/runway/src/core/functions/__tests__/planned-extensions.function.test.ts` and `packages/developer/runway/src/core/functions/__tests__/create-extensions-script.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, EC-02, EC-04, AC-006 — route: tests
- [x] T002 Add `plannedExtensions` in `packages/developer/runway/src/core/functions/planned-extensions.function.ts` and `createExtensionsScript` in `packages/developer/runway/src/core/functions/create-extensions-script.function.ts`, exported from `packages/developer/runway/src/core/index.ts` (checked by `packages/developer/runway/src/core/__tests__/index.test.ts`) — covers: FR-001, FR-002, P-001, P-002, AC-006 — route: package — deps: T001

## Phase 2: User Story 1 - AWS creates the extensions before migrations (Priority: P1)

**Goal**: one extensions run per Postgres resource, which its workloads wait for.

**Independent Test**: `awsDatabases` and `awsWorkloads` under Pulumi mocks.

- [x] T003 [US1] Test first: the admin login from the proxy secret, once per revision, its own security group, the hand-back by resource name, nothing without extensions in `packages/infrastructure/infra-aws-runtime/src/node/functions/__tests__/aws-databases.function.test.ts` — covers: FR-003, FR-010, P-004, P-006, EC-01, AC-001, AC-003, AC-004 — route: tests — deps: T002
- [x] T004 [US1] Declare the setup role, cluster, group, log group, task and run in `packages/infrastructure/infra-aws-runtime/src/node/functions/aws-databases.function.ts` with `packages/infrastructure/infra-aws-runtime/src/node/constants/database-setup-settings.constant.ts`, and use `plannedExtensions` in `packages/infrastructure/infra-aws-runtime/src/core/functions/runtime-plan.function.ts` — covers: FR-003, FR-010, P-004, P-006, AC-001, AC-003, AC-004 — route: package — deps: T003
- [x] T005 [US1] Test first, then make a workload's migration and service wait for its databases' runs in `packages/infrastructure/infra-aws-runtime/src/node/functions/aws-workloads.function.ts` and wire `ready` in `packages/infrastructure/infra-aws-runtime/src/node/functions/aws-runtime.function.ts` (test: `aws-workloads.function.test.ts`) — covers: FR-004, P-003, AC-001 — route: package — deps: T004

## Phase 3: User Story 2 - A failure stops the deploy before any migration (Priority: P1)

- [x] T006 [US2] Test first, then add `purpose: "extensions"` to `packages/infrastructure/infra-aws-runtime/src/node/types/workload-migration-inputs.type.ts` and its failure wording to `packages/infrastructure/infra-aws-runtime/src/node/constants/workload-migration-provider.constant.ts` (test: `workload-migration-provider.constant.test.ts`) — covers: FR-005, AC-002 — route: package — deps: T004

## Phase 4: User Story 1 - GCP creates the extensions before migrations (Priority: P1)

- [x] T007 [US1] Test first, then return the services' extensions from `packages/infrastructure/infra-gcp/src/core/functions/gcp-runtime-config.function.ts` as `database.extensions` on `packages/infrastructure/infra-gcp/src/core/types/gcp-runtime-config.type.ts` (test: `gcp-runtime-config.function.test.ts`) — covers: FR-006, AC-001 — route: package — deps: T002
- [x] T008 [US1] Test first, then declare the admin user, the in-region secret, the reader account and the Cloud Run job in `packages/infrastructure/infra-gcp/src/node/functions/database-extensions.function.ts` with `packages/infrastructure/infra-gcp/src/core/constants/database-setup-settings.constant.ts`, called from `packages/infrastructure/infra-gcp/src/node/functions/gcp-runtime.function.ts`, refusing planned extensions without `adminPassword` (test: `gcp-runtime.function.test.ts`) — covers: FR-007, FR-008, FR-010, P-004, P-006, EC-03, AC-001, AC-002, AC-003, AC-004 — route: package — deps: T007

## Phase 5: User Story 3 - The deploy identity may create the job's secret (Priority: P1)

- [x] T009 [US3] Test first: every provider module the extensions path declares maps to a role in `DEPLOY_ROLES`, owner and editor never granted; then add `roles/secretmanager.admin` in `packages/infrastructure/infra-gcp/src/node/constants/deploy-roles.constant.ts` (test: `packages/infrastructure/infra-gcp/src/node/constants/__tests__/deploy-roles.constant.test.ts`) — covers: FR-009, P-005, EC-06, AC-005 — route: package — deps: T008

## Phase 6: Polish

- [x] T010 Record the build and the owner steps in `apps/docs/src/docs/adr/0160-raw-sql-at-runtime-and-the-approved-postgres-extensions.mdx`, `packages/developer/runway/README.md`, `packages/infrastructure/infra-aws-runtime/README.md`, `packages/infrastructure/infra-gcp/README.md`, `packages/infrastructure/infra-gcp/AGENTS.md`, `.changeset/runway-planned-extensions.md`, `.changeset/infra-aws-runtime-extensions-before-migrations.md` and `.changeset/infra-gcp-extensions-before-migrations.md` — covers: SC-001, SC-002, SC-003, AC-001, AC-005 — route: steward-docs — deps: T009
- [ ] T011 Run the three packages' tests, typecheck, oxlint and oxfmt, then `pnpm verify`, in `packages/infrastructure/infra-gcp/package.json` — covers: SC-001, SC-002, SC-003, SC-004, SC-005, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T010
