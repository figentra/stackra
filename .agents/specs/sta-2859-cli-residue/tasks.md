---
description: "Tasks for STA-2859: the CLI's doctor, dev tunnel and starter carry no Figentra-internal advice"
---

# Tasks: the CLI's doctor, dev tunnel and starter carry no Figentra-internal advice

**Input**: Design documents from `.agents/specs/sta-2859-cli-residue/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: User Story 2 - Doctor finds tools on Windows (Priority: P1)

**Goal**: no `which`.

**Independent Test**: `commandOnPath` on temporary folders and Windows paths; doctor on an empty `PATH`.

- [x] T001 [US2] Test first: POSIX and Windows lookups in `packages/developer/cli/src/node/doctor/functions/__tests__/command-on-path.function.test.ts` — covers: FR-001, P-001, EC-01, EC-02, EC-03, EC-04, AC-004 — route: tests
- [x] T002 [US2] Add `commandOnPath` in `packages/developer/cli/src/node/doctor/functions/command-on-path.function.ts` and use it for `has` in `packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts` — covers: FR-001, P-001, AC-003, AC-004 — route: package — deps: T001

## Phase 2: User Story 1 - Doctor's advice works for anyone (Priority: P1)

**Goal**: generic network, registry and secrets advice.

**Independent Test**: `doctorChecks` with an injected probe and an empty `PATH`.

- [x] T003 [US1] Test first: the network row in `packages/developer/cli/src/node/doctor/functions/__tests__/network-check.function.test.ts` and the advice of every row in `packages/developer/cli/src/node/doctor/functions/__tests__/doctor-checks.function.test.ts` — covers: FR-002, FR-003, P-002, P-003, AC-001, AC-002, AC-003 — route: tests — deps: T002
- [x] T004 [US1] Add `networkCheck` in `packages/developer/cli/src/node/doctor/functions/network-check.function.ts`, an injectable network probe and the generic registry, Google login and `secrets checkout` rows in `packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts`, the group in `packages/developer/cli/src/node/doctor/functions/doctor-group.function.ts`, the secrets-checkout wording in the comments of `packages/developer/cli/src/node/doctor/functions/google-credentials-path.function.ts` and `packages/developer/cli/src/node/doctor/types/doctor-need.type.ts` — covers: FR-002, FR-003, P-002, P-003, AC-001, AC-002 — route: package — deps: T003

## Phase 3: User Story 3 - The tunnel, `mcp exec` and a new service (Priority: P2)

- [x] T005 [US3] Test first: the tunnel refusal and usage in `packages/developer/cli/src/node/dev-tunnel/functions/__tests__/start-tunnel.function.test.ts` and `packages/developer/cli/src/node/dev-surface/constants/__tests__/dev-command.constant.test.ts`, the service header in `packages/developer/cli/src/node/functions/__tests__/service-template.function.test.ts`, the checkout error in `packages/developer/mcp/src/core/functions/__tests__/mcp-exec-command.function.test.ts` — covers: FR-004, FR-005, FR-006, P-005, P-006, P-007, AC-005 — route: tests
- [x] T006 [US3] Generic text in `packages/developer/cli/src/node/dev-tunnel/functions/start-tunnel.function.ts`, `packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts`, `packages/developer/cli/src/node/functions/service-template.function.ts` and `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts`; the same wording in the comments of `packages/developer/cli/src/node/dev-tunnel/constants/dev-tunnel-settings.constant.ts`, `packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts`, `packages/developer/mcp/src/core/types/mcp-exec-options.type.ts` and `packages/developer/mcp/src/node/functions/exec-with-secrets.function.ts` — covers: FR-004, FR-005, FR-006, P-005, P-006, P-007, AC-005 — route: package — deps: T005

## Phase 4: User Story 4 - A starter keeps its own tooling out of apps (Priority: P1)

- [x] T007 [US4] Test first: `exclude` with dot paths, an overlay over an excluded path, a malformed `exclude` in `packages/developer/cli/src/node/create/functions/__tests__/create.test.ts` — covers: FR-007, P-004, EC-05, EC-06, AC-006 — route: tests
- [x] T008 [US4] Add `exclude` to `packages/developer/cli/src/node/create/types/starter-manifest.type.ts` and apply it in `packages/developer/cli/src/node/create/functions/starter-files.function.ts` — covers: FR-007, P-004, AC-006 — route: package — deps: T007

## Phase 5: Polish

- [x] T009 Docs and changesets: `packages/developer/cli/README.md`, `.changeset/cli-no-internal-residue.md`, `.changeset/mcp-exec-secrets-checkout.md` — covers: SC-004, AC-002, AC-006 — route: steward-docs — deps: T008
- [x] T010 Run the tests, typecheck, oxlint and oxfmt of `packages/developer/cli` and `packages/developer/mcp` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T009
