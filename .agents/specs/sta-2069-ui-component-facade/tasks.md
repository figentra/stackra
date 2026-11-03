---
description: "Tasks for STA-2069: gen writes the #stackra/ui class-component facade"
---

# Tasks: gen writes the `#stackra/ui` class-component facade

**Input**: Design documents from `.agents/specs/sta-2069-ui-component-facade/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Setup

- [x] T001 Name the emitter that writes `#stackra/ui` in the contract comment of `packages/developer/gen/src/node/constants/component-module.constant.ts` — covers: FR-001, AC-001 — route: gen

## Phase 2: User Story 1 - A class component type-checks (Priority: P1)

**Goal**: a member that declares `@stackra/ui` gets `.stackra/gen/ui.ts`, so `#stackra/ui` resolves for tsc.

**Independent Test**: emit the facade for an app IR whose packages include `@stackra/ui`; it re-exports `Component`
from `@stackra/ui/react`.

- [x] T002 [US1] Test the react entry (web app, package, web plus iOS), the native entry (iOS and Android only), no file without `@stackra/ui` or without `packages`, and the header plus one export line, in `packages/developer/gen/src/core/functions/__tests__/emit-ui-facade.function.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, EC-01, EC-02, EC-03, EC-04, AC-001, AC-002, AC-003 — route: tests — deps: T001
- [x] T003 [US1] Write `emitUiFacade` in `packages/developer/gen/src/core/functions/emit-ui-facade.function.ts` — covers: FR-001, FR-002, FR-003, FR-004, P-001, P-002, P-003, AC-001, AC-002, AC-003 — route: gen — deps: T002
- [x] T004 [US1] Add the `.stackra/gen/ui.ts` row to the optional files in `packages/developer/gen/src/core/functions/generate-member.function.ts` — covers: FR-001, FR-003, SC-001, AC-003 — route: gen — deps: T003
- [ ] T005 [US1] Give the golden web app `@stackra/ui`, the `#stackra/*` alias, a class component and a `@stackra/ui` stand-in under `packages/developer/gen/__golden__/app-clients/input/`, and refresh `packages/developer/gen/__golden__/app-clients/expected/` on ci-box — covers: FR-001, SC-002, EC-05, AC-004 — route: gen — deps: T004
- [ ] T006 [US1] On ci-box, run `tsc --noEmit` over the golden cache of `apps/web` (`packages/developer/gen/.cache/golden/app-clients/apps/web`) with the class component and record the result on the PR — covers: FR-001, SC-003, AC-005 — route: verify-fix — deps: T005

## Phase 3: Polish

- [x] T007 [P] Add the `emitUiFacade` and `.stackra/gen/ui.ts` rows to `packages/developer/gen/README.md` — covers: FR-001, AC-001 — route: steward-docs — deps: T004
- [x] T008 [P] Add a changeset for `@stackra/gen` in `.changeset/sta-2069-ui-component-facade.md` — covers: SC-004, AC-001 — route: steward-changesets — deps: T004
- [ ] T009 Run the gen package's gate (format, lint, typecheck, test, build) on ci-box for `packages/developer/gen` — covers: SC-001, SC-004, AC-001, AC-004 — route: verify-fix — deps: T005, T006, T007, T008
