# Tasks: `@stackra/state-machine` wave 4

**Input**: `.agents/specs/sta-348-state-machine/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-state-machine/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/state-machine` — covers: FR-001, FR-006, P-001, P-006 — route: package — deps: T001
- [x] T003 [US1] [US3] `TransitionNotAllowedError` in `packages/data/state-machine/src/core/errors/transition-not-allowed.error.ts`, `StateTransitioned` in `packages/data/state-machine/src/core/events/state-transitioned.event.ts` and its shipped schema in `packages/data/state-machine/src/core/constants/state-transitioned-schema.constant.ts` — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] [US2] [US4] `Transition` in `packages/data/state-machine/src/core/decorators/transition.decorator.ts`, `StateMachine` and `StateMachineBase` in `packages/data/state-machine/src/core/bases/state-machine.base.ts`, and the types in `packages/data/state-machine/src/core/types/` — covers: FR-003, FR-004, FR-005, P-003, P-004, P-005 — route: package — deps: T003
- [x] T005 Stand-in barrel `packages/data/state-machine/src/core/index.ts` — covers: FR-002, P-002 — route: package — deps: T004
- [x] T006 Tests beside every subject and the barrel test `packages/data/state-machine/src/core/__tests__/index.test.ts` — covers: SC-001, SC-002 — route: tests — deps: T005
- [x] T007 Changeset `.changeset/state-machine-package.md`; `oxfmt` and `oxlint` clean — covers: SC-001 — route: package — deps: T005
- [ ] T008 `pnpm install` to link the member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T006
