---
description: "Tasks for STA-2924: commands share a set of options, declared once"
---

# Tasks: commands share a set of options, declared once

**Input**: Design documents from `.agents/specs/sta-2924-console-shared-option-sets/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The option set

- [x] T001 Test first: two commands with one set, help, parsing, defaults and the clash errors in `packages/developer/console/src/core/functions/__tests__/option-sets.test.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, AC-001, AC-002, AC-003, AC-004, AC-005, EC-01, EC-02, EC-03, EC-04 — route: tests
- [x] T002 Add the kind base, the decorator, the class type and the field's set, read the sets and fill them, in `packages/developer/console/src/core/bases/option-set.base.ts`, `packages/developer/console/src/core/decorators/options.decorator.ts`, `packages/developer/console/src/core/decorators/option.decorator.ts`, `packages/developer/console/src/core/types/option-set-class.type.ts`, `packages/developer/console/src/contracts/types/command-field.type.ts`, `packages/developer/console/src/core/functions/read-command.function.ts`, `packages/developer/console/src/core/functions/fill-command.function.ts`, `packages/developer/console/src/core/functions/run-command.function.ts`, `packages/developer/console/src/core/index.ts` — covers: FR-001, FR-002, FR-003, P-001, P-002, P-003, AC-001, AC-002, AC-003, AC-004, AC-005 — route: package — deps: T001

## Phase 2: The kind tables

- [x] T003 Add `option_set` to `packages/foundation/validation/src/core/constants/shape-kinds.constant.ts`, `packages/developer/gen/src/node/constants/kind-bases.constant.ts`, `packages/developer/gen/src/core/constants/kind-files.constant.ts`, `packages/developer/coding-standard/src/core/constants/kind-bases.constant.ts` — covers: FR-001, P-004, AC-006 — route: package — deps: T002

## Phase 3: Polish

- [x] T004 Document the set in `apps/docs/src/docs/guides/console.mdx`, `packages/developer/console/README.md` and `.changeset/console-option-sets.md` — covers: SC-001, SC-002, AC-001, AC-005 — route: steward-docs — deps: T003
