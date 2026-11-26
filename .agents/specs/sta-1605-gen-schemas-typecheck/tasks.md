---
description: "Tasks for STA-1605: what gen writes typechecks, and every library member checks it"
---

# Tasks: what gen writes typechecks, and every library member checks it

**Input**: Design documents from `.agents/specs/sta-1605-gen-schemas-typecheck/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The validation helpers

**Goal**: a typed literal default and field types without markers.

- [x] T001 Test first, then add `withDefault` and `DefaultLiteral` in `packages/foundation/validation/src/core/functions/with-default.function.ts` and `packages/foundation/validation/src/core/types/default-literal.type.ts`, exported from `packages/foundation/validation/src/core/index.ts`, with `with-default.function.test.ts` — covers: FR-002, P-002, AC-002 — route: package
- [x] T002 Test first, then drop symbol keys in `packages/foundation/validation/src/core/types/fields.type.ts` and `packages/foundation/validation/src/core/types/input-fields.type.ts`, with `fields.type.test.ts` — covers: FR-005, P-003 — route: package

## Phase 2: User Story 2 and 3 - The emitters write code that typechecks (Priority: P1)

**Goal**: schemas, entities and wiring typecheck.

**Independent Test**: `generated-schemas-typecheck.test.ts`.

- [x] T003 [US2] Test first: `packages/developer/gen/src/node/__tests__/generated-schemas-typecheck.test.ts` runs `generate` on the shop fixture with a display schema and typechecks the output — covers: FR-002, P-002, AC-002 — route: tests — deps: T001
- [x] T004 [US2] Write literal defaults through `withDefault`, omit getters from `X$Check`, check generic shapes over `any`, limit the `~defaults` brand and compile an empty driver-name field to `z.string()` in `packages/developer/gen/src/core/functions/emit-schemas.function.ts`; drop the brand rows from `packages/developer/gen/src/core/functions/emit-entities.function.ts` and `packages/developer/gen/src/core/functions/emit-hosted-entities.function.ts`; read type parameters into `packages/developer/gen/src/core/types/shape-ir.type.ts` — covers: FR-002, FR-003, FR-004, FR-010, P-003, AC-002 — route: package — deps: T003
- [x] T005 [US3] Skip authored `DriverRegistry` keys, keep one candidate per name and list `./worker` drivers only for a Worker in `packages/developer/gen/src/core/functions/emit-wiring.function.ts`, reading the keys in `packages/developer/gen/src/node/functions/create-source-reader.function.ts` and `packages/developer/gen/src/node/functions/discover-member.function.ts`; keep an import's name for an imported class; admit `Container` in `packages/foundation/container/src/core/types/wiring.type.ts` — covers: FR-006, FR-008, P-004, AC-006 — route: package
- [x] T006 [US3] Test first, then strip a member-named port's prefix in `packages/developer/gen/src/core/functions/driver-name.function.ts` with `portMember` in `packages/developer/gen/src/core/functions/port-member.function.ts`, used by `build-manifest`, `emit-wiring`, `system-driver-defaults` and `discover-member` — covers: FR-007, P-005, AC-004 — route: package
- [x] T007 [US3] Test first, then give a member off the container no module in `packages/developer/gen/src/core/functions/root-module-of.function.ts` — covers: FR-009, P-006, AC-005 — route: package

## Phase 3: User Story 1 - Members check what gen writes (Priority: P1)

- [x] T008 [US1] Test first, then include `.stackra/gen` and `.stackra/entry` in `packages/tooling/typescript/src/library.json` (`presets.test.ts`), fix the analytics, panel, settings and registry schemas the check found, and regenerate the manifests — covers: FR-001, P-001, AC-001, AC-003 — route: package — deps: T004, T005, T006, T007

## Phase 4: Polish

- [x] T009 Update `packages/tooling/typescript/README.md` and add `.changeset/gen-schemas-typecheck.md` — covers: SC-002, AC-001 — route: steward-docs — deps: T008
- [x] T010 Run `pnpm gen` and every member's `tsc --noEmit`, then the touched packages' tests, typecheck, oxlint and oxfmt, in `packages/developer/gen/package.json` — covers: SC-001, SC-002, SC-003, SC-004, AC-001, AC-002, AC-003, AC-004, AC-005, AC-006 — route: verify-fix — deps: T009
