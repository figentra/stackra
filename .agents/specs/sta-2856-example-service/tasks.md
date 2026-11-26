---
description: "Tasks for STA-2856: an end-to-end example service (sign-in, tenancy, several surfaces, events and jobs)"
---

# Tasks: an end-to-end example service (sign-in, tenancy, several surfaces, events and jobs)

**Input**: Design documents from `.agents/specs/sta-2856-example-service/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The notes resource

**Goal**: the placeholder becomes a v3 member with a tenant-owned resource.

- [x] T001 Carry the X11 notes resource (PR #1064's example commits) onto `main` in `services/example/src/modules/notes/` with `services/example/stackra.config.ts` and `services/example/package.json` — covers: FR-001 — route: service

## Phase 2: User Story 1 - Copy a proven pattern (Priority: P1)

**Goal**: the activity feed, its listeners and its per-tenant job.

**Independent Test**: `stackra test` and `stackra test --tier int` in `services/example`.

- [x] T002 [US1] Add `ActivityEntry`, its migration, `ActivityKind` and `ActivityEntryService` in `services/example/src/modules/activity/` — covers: FR-002, FR-004 — route: service — deps: T001
- [x] T003 [US1] Test first, then add the three listeners in `services/example/src/modules/activity/listeners/` — covers: FR-002, P-001, AC-001 — route: service — deps: T002
- [x] T004 [US1] Test first, then add `ListActivityQuery`, its schemas and view in `services/example/src/modules/activity/queries/list-activity.query.ts` — covers: FR-003, AC-001 — route: service — deps: T002
- [x] T005 [US1] Test first, then add `PruneActivityAction` with its per-tenant cron in `services/example/src/modules/activity/actions/prune-activity.action.ts` — covers: FR-004, P-002, AC-003 — route: service — deps: T002
- [x] T006 [US1] The feed and the cron end to end on the generated wiring in `services/example/src/modules/activity/__tests__/activity-feed.test.ts`, and the surfaces in `services/example/src/modules/activity/__tests__/activity-manifest.test.ts` — covers: FR-002, FR-003, FR-004, FR-007, EC-01, EC-04, EC-05, AC-001, AC-002, AC-003 — route: tests — deps: T003, T004, T005
- [x] T007 [US1] Tenant isolation of the feed and the job on Postgres in `services/example/src/modules/activity/__tests__/activity-isolation.int.test.ts` — covers: FR-007, EC-02, EC-03, AC-004 — route: tests — deps: T005

## Phase 3: User Story 2 - A signed-in caller in their tenant (Priority: P1)

- [x] T008 [US2] Sign-in through `CallAuthenticator` over the generated wiring in `services/example/src/modules/notes/__tests__/sign-in.test.ts` — covers: FR-007, AC-005 — route: tests — deps: T001

## Phase 4: User Story 3 - A generated service's crons run (Priority: P1)

- [x] T009 [US3] Test first, then bind `SchedulerService` and default `CronScopes` to tenancy in `packages/developer/gen/src/core/constants/boot-services.constant.ts` and `packages/developer/gen/src/core/functions/system-driver-defaults.function.ts` — covers: FR-005, FR-006, P-003, P-004, AC-006 — route: package

- [x] T012 [US1] Test first, then refuse a cursor no page gave in `packages/data/database/src/core/bases/crud-service.base.ts` with `packages/data/database/src/core/errors/table-cursor-invalid.error.ts` — covers: FR-008, P-005, EC-06, AC-007 — route: package

## Phase 5: Polish

- [x] T010 Document it in `services/example/README.md`, `services/example/AGENTS.md`, `services/README.md`, `packages/developer/gen/README.md`, ADR 0075 and `.changeset/gen-binds-the-scheduler-and-tenant-cron-scopes.md` — covers: SC-005 — route: steward-docs — deps: T006, T009
- [x] T011 Run the integration tier on Postgres (Docker on the box) and the touched members' tests, typecheck, oxlint, oxfmt, `stackra gen --check`, doc-standard, duplication and `validate --repository` for `services/example/package.json` — covers: SC-003, SC-005, AC-004 — route: verify-fix — deps: T010
