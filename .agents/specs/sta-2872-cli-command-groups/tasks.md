---
description: "Tasks for STA-2872: the stackra command list is grouped and short, with the core-repository checks hidden"
---

# Tasks: the stackra command list is grouped and short, with the core-repository checks hidden

**Input**: Design documents from `.agents/specs/sta-2872-cli-command-groups/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The console list

**Goal**: `@stackra/console` orders headings, leaves out unlisted commands and answers `list [--all]`.

- [x] T001 Test first: heading order, unlisted commands out of the list, `--json` and completion, the hint, `list`, `list --all`, usage errors and a registered `list` in `packages/developer/console/src/core/functions/__tests__/command-list.test.ts` and `route.function.test.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, AC-002, AC-003, AC-004, EC-02, EC-03 — route: tests
- [x] T002 Add `groups` and `unlisted` to `packages/developer/console/src/core/types/console-config.type.ts`, `CommandListOptions`, the `Renderer.commandList` options, the ordering in `render-list.function.ts`, the list and completion filtering in `create-console.function.ts`, the `list` route in `route.function.ts` and the completion entry in `tab-completions.driver.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, AC-002, AC-003, AC-004 — route: package — deps: T001

## Phase 2: User Story 1 - A newcomer reads the list (Priority: P1)

**Goal**: every `stackra` command names its heading; the minimal app lists at most 25.

**Independent Test**: `runCli` on the minimal-profile workspace in a temp folder.

- [x] T003 [US1] Test first: every command has a group, the Repository and hidden sets in `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts` — covers: FR-001, P-006, AC-006 — route: tests — deps: T002
- [x] T004 [US1] Add `COMMAND_GROUPS`, `CommandGroup`, `CliCommand.group` and `hidden`, pass them through `legacy-command.function.ts`, and give every command in `packages/developer/cli/src/node` its `group` — covers: FR-001, P-006, AC-006 — route: package — deps: T003
- [x] T005 [US1] Test first: the minimal app's 25 commands, the heading order and the hint in `packages/developer/cli/src/node/functions/__tests__/unlisted-command.function.test.ts` — covers: FR-002, P-004, AC-001, AC-002 — route: tests — deps: T004

## Phase 3: User Story 3 - The list follows what the workspace uses (Priority: P2)

- [x] T006 [US3] Test first: `isCoreRepository`, `workspaceFits`, the product, package, seed-pack and core cases, an unreadable workspace and the lazy read in `packages/developer/cli/src/node/functions/__tests__/` — covers: FR-002, P-005, EC-01, EC-04, EC-05, AC-005 — route: tests — deps: T005
- [x] T007 [US3] Add `COMMAND_FITS`, `CommandFit`, `isCoreRepository`, `workspaceFits` and `unlistedCommand`, and pass `groups` and `unlisted` from `packages/developer/cli/src/node/functions/run-cli.function.ts` — covers: FR-002, P-004, P-005, AC-001, AC-002, AC-005 — route: package — deps: T006

## Phase 4: User Story 2 - Every command is still there (Priority: P1)

- [x] T008 [US2] Test: `list --all` holds every command and a Repository check runs by name in an app, in `packages/developer/cli/src/node/functions/__tests__/unlisted-command.function.test.ts` — covers: FR-003, P-003, AC-003, AC-004 — route: tests — deps: T007

## Phase 5: Polish

- [x] T009 Document the list in `packages/developer/cli/README.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx` and `.changeset/cli-command-groups.md` — covers: SC-001, SC-002, AC-001, AC-003 — route: steward-docs — deps: T008
- [x] T010 Run the `@stackra/console` and `@stackra/cli` tests, typecheck, oxlint and oxfmt, and the revert check, in `packages/developer/cli/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T009

## Phase 6: Review conditions

- [x] T011 Test first: `list --all --json` keeps each command's real `hidden` value in `packages/developer/console/src/core/functions/__tests__/command-list.test.ts`; the mobile build checks are listed under Deploy and Quality with a mobile app in `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts` and `packages/developer/cli/src/node/functions/__tests__/unlisted-command.function.test.ts` — covers: FR-002, FR-003, P-007, P-008, AC-007, AC-008 — route: tests — deps: T010
- [x] T012 Keep the declared `hidden` in the list data of `packages/developer/console/src/core/functions/create-console.function.ts`; move `eas-preflight` to Deploy and `app-native-deps` to Quality with the `mobile` fit in `packages/developer/cli/src/node/constants/command-fits.constant.ts` — covers: FR-002, FR-003, P-007, P-008, AC-007, AC-008 — route: package — deps: T011
