---
description: "Tasks for STA-2883: the day-one stackra commands are native console commands that ask, explain and answer --json"
---

# Tasks: the day-one stackra commands are native console commands that ask, explain and answer --json

**Input**: Design documents from `.agents/specs/sta-2883-native-commands/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Running a body from a class

**Goal**: a console class runs a `CliCommand` body byte-identical, with `--json` and the run's runtime.

- [x] T001 Test first: options by flag name, positionals and rest, byte-identical writes, the usage hint, and the three `--json` data sources in `packages/developer/cli/src/node/functions/__tests__/run-body.function.test.ts` — covers: FR-005, FR-007, P-005, P-007, EC-01, AC-003, AC-006 — route: tests
- [x] T002 Add `runBody`, `CliRuntime`, `PIPED_RUNTIME`, `CLI_RUNTIME_STORE`, `currentCliRuntime` and the optional report on CliContext, and run the console inside the store, in `packages/developer/cli/src/node/functions/run-body.function.ts`, `packages/developer/cli/src/node/types/cli-runtime.type.ts`, `packages/developer/cli/src/node/constants/piped-runtime.constant.ts`, `packages/developer/cli/src/node/constants/cli-runtime-store.constant.ts`, `packages/developer/cli/src/node/functions/current-cli-runtime.function.ts`, `packages/developer/cli/src/node/types/cli-context.type.ts` and `packages/developer/cli/src/node/functions/run-cli.function.ts` — covers: FR-005, FR-007, P-005, P-007, EC-05, AC-003, AC-006 — route: package — deps: T001

## Phase 2: User Story 2 - Every day-one command explains itself (Priority: P1)

**Goal**: the 23 passthrough commands are classes declaring every option.

**Independent Test**: `commands.constant.test.ts` reads each class and stubs its body.

- [x] T003 [US2] Test first: the ported set, field parity, every field reaching the body, and no passthrough left in `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts`, `packages/developer/cli/src/node/functions/__tests__/run-cli.function.test.ts` and `packages/developer/cli/src/node/dev-surface/constants/__tests__/dev-command.constant.test.ts` — covers: FR-001, FR-002, P-001, P-002, AC-004, AC-005, EC-03, EC-04, EC-06 — route: tests — deps: T002
- [x] T004 [US2] Add the 23 command classes in `packages/developer/cli/src/node/commands/`, register them in `packages/developer/cli/src/node/constants/commands.constant.ts`, drop `group` / `hidden` from `packages/developer/cli/src/node/types/cli-command.type.ts`, `packages/developer/cli/src/node/types/cli-commands.type.ts` and the body constants (`packages/developer/cli/src/node/constants/console-command.constant.ts`, `packages/developer/cli/src/node/constants/db-diff-command.constant.ts`, `packages/developer/cli/src/node/constants/db-seed-command.constant.ts`, `packages/developer/cli/src/node/constants/mcp-command.constant.ts`, `packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts`, `packages/developer/cli/src/node/constants/new-command.constant.ts`, `packages/developer/cli/src/node/constants/seed-pack-command.constant.ts`, `packages/developer/cli/src/node/constants/testbed-command.constant.ts`, `packages/developer/cli/src/node/constants/validate-command.constant.ts`, `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts`, `packages/developer/cli/src/node/eas-preflight/constants/eas-preflight-command.constant.ts`, `packages/developer/cli/src/node/product/constants/build-command.constant.ts`, `packages/developer/cli/src/node/product/constants/deploy-command.constant.ts`, `packages/developer/cli/src/node/product/constants/preview-serve-command.constant.ts`), record them in `packages/developer/cli/stackra.manifest.json`, and delete the legacy wrapper (legacy-command.function.ts) from `packages/developer/cli/src/node/functions/` — covers: FR-001, FR-002, P-001, P-002, AC-004, AC-005 — route: package — deps: T003

## Phase 3: User Story 1 - A newcomer creates a member without knowing the flags (Priority: P1)

- [x] T005 [US1] Test first: the questions in a terminal, nothing asked without one, the exit-2 refusals and `newKinds` in `packages/developer/cli/src/node/commands/__tests__/new.command.test.ts` — covers: FR-003, FR-004, P-003, P-004, AC-001, AC-002, EC-02 — route: tests — deps: T004
- [x] T006 [US1] Add `askNew`, `newKinds` and `NewAnswers` in `packages/developer/cli/src/node/functions/ask-new.function.ts`, `packages/developer/cli/src/node/functions/new-kinds.function.ts` and `packages/developer/cli/src/node/types/new-answers.type.ts`, and ask before the body in `packages/developer/cli/src/node/commands/new.command.ts` — covers: FR-003, FR-004, P-003, P-004, AC-001, AC-002 — route: package — deps: T005

## Phase 4: User Story 3 - Scripts and agents read --json (Priority: P2)

- [x] T007 [US3] Test first, then `GenOutcome`, `runGen`'s `onOutcome` and `GEN_COMMAND`'s report in `packages/developer/cli/src/node/commands/__tests__/gen.command.test.ts`, `packages/developer/cli/src/node/types/gen-outcome.type.ts`, `packages/developer/cli/src/node/functions/run-gen.function.ts` and `packages/developer/cli/src/node/constants/gen-command.constant.ts` — covers: FR-006, P-006, AC-003 — route: package — deps: T004
- [x] T010 [US3] Test first, then `runCheck` reports `{ phases, findings }` and `VALIDATE_COMMAND --repository` its findings, in `packages/developer/cli/src/node/commands/__tests__/check.command.test.ts`, `packages/developer/cli/src/node/functions/__tests__/run-check.function.test.ts`, `packages/developer/cli/src/node/functions/run-check.function.ts` and `packages/developer/cli/src/node/constants/validate-command.constant.ts` — covers: FR-005, P-008, AC-006 — route: package — deps: T004

## Phase 5: Polish

- [x] T008 Document the commands in `packages/developer/cli/README.md`, `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx` and `.changeset/cli-native-commands.md` — covers: SC-001, SC-002, AC-001, AC-003, AC-006 — route: steward-docs — deps: T007, T010
- [x] T009 Run the CLI package tests, typecheck, oxlint, oxfmt, `gen --check`, the revert checks and the built-binary proof, in `packages/developer/cli/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T008

## Phase 7: Review conditions

- [x] T011 Test first, then make the `--os` help of `packages/developer/cli/src/node/commands/dev.command.ts` and `packages/developer/cli/src/node/commands/build.command.ts` neutral (a template checkout, with examples on a sibling template folder), proved in `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts` — covers: FR-001, AC-007 — route: package
- [x] T012 Test first, then declare the dev compose flags on `packages/developer/cli/src/node/commands/dev.command.ts` and read a boolean named `no-<x>` beside an option `<x>` as itself in `packages/developer/console/src/core/functions/parse-invocation.function.ts`, proved in `packages/developer/console/src/core/functions/__tests__/parse-invocation.function.test.ts`, `packages/developer/cli/src/node/constants/__tests__/commands.constant.test.ts` and `packages/developer/cli/src/node/dev-surface/constants/__tests__/dev-command.constant.test.ts` — covers: FR-001, FR-002, AC-004 — route: package — deps: T011
