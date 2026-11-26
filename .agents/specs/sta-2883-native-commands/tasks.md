---
description: "Tasks for STA-2883: the day-one stackra commands are native console commands that ask, explain and answer --json"
---

# Tasks: the day-one stackra commands are native console commands that ask, explain and answer --json

**Input**: Design documents from `.agents/specs/sta-2883-native-commands/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Running a body from a class

**Goal**: a console class runs a `CliCommand` body byte-identical, with `--json` and the run's runtime.

- [x] T001 Test first: options by flag name, positionals and rest, byte-identical writes, the usage hint, and the three `--json` data sources in `packages/developer/cli/src/node/functions/__tests__/run-body.function.test.ts` — covers: FR-005, FR-007, P-005, EC-01 — route: tests
- [x] T002 Add `runBody`, `CliRuntime`, `PIPED_RUNTIME`, `CLI_RUNTIME_STORE`, `currentCliRuntime` and `CliContext.report`, and run the console inside the store in `packages/developer/cli/src/node/functions/run-cli.function.ts` — covers: FR-005, FR-007, P-005, EC-05 — route: package — deps: T001

## Phase 2: User Story 2 - Every day-one command explains itself (Priority: P1)

**Goal**: the 23 passthrough commands are classes declaring every option.

**Independent Test**: `commands.constant.test.ts` reads each class and stubs its body.

- [x] T003 [US2] Test first: the ported set, field parity, every field reaching the body, and no passthrough left in `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts` and `functions/__tests__/run-cli.function.test.ts` — covers: FR-001, FR-002, P-001, P-002, AC-004, AC-005, EC-03, EC-04, EC-06 — route: tests — deps: T002
- [x] T004 [US2] Add the 23 command classes in `packages/developer/cli/src/node/commands/`, register them in `constants/commands.constant.ts`, drop `CliCommand.group` / `hidden` and delete `functions/legacy-command.function.ts` — covers: FR-001, FR-002, P-001, P-002 — route: package — deps: T003

## Phase 3: User Story 1 - A newcomer creates a member without knowing the flags (Priority: P1)

- [x] T005 [US1] Test first: the questions in a terminal, nothing asked without one, the exit-2 refusals and `newKinds` in `packages/developer/cli/src/node/commands/__tests__/new.command.test.ts` — covers: FR-003, FR-004, P-003, AC-001, AC-002, EC-02 — route: tests — deps: T004
- [x] T006 [US1] Add `askNew`, `newKinds` and `NewAnswers`, and ask before the body in `packages/developer/cli/src/node/commands/new.command.ts` — covers: FR-003, FR-004, P-003 — route: package — deps: T005

## Phase 4: User Story 3 - Scripts and agents read --json (Priority: P2)

- [x] T007 [US3] Test first, then `GenOutcome`, `runGen`'s `onOutcome` and `GEN_COMMAND`'s report in `packages/developer/cli/src/node/commands/__tests__/gen.command.test.ts` and `constants/gen-command.constant.ts` — covers: FR-006, P-004, AC-003 — route: package — deps: T004

## Phase 5: Polish

- [x] T008 Document the commands in `packages/developer/cli/README.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx` and `.changeset/cli-native-commands.md` — covers: SC-001, SC-002, AC-001, AC-003 — route: steward-docs — deps: T007
- [x] T009 Run the `@stackra/cli` tests, typecheck, oxlint, oxfmt, `gen --check`, the revert checks and the built-binary proof, in `packages/developer/cli/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005 — route: verify-fix — deps: T008
