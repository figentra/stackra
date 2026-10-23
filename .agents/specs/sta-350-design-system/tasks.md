# Tasks: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Input**: `.agents/specs/sta-350-design-system/`

## Phase 1: Decisions and category

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-350-design-system/spec.md` — covers: SC-001 — route: spec-draft
- [ ] T002 [US1] ADR 0302 and the amendment notes in `apps/docs/src/adr` — covers: SC-001 — route: adr — deps: T001
- [ ] T003 [US1] The `design-system` category in `tools/scripts/structure.mjs`, `tools/scripts/validate-repository.mjs` and `tools/scripts/scaffold.mjs`, with their tests and the regenerated `apps/docs/src/standards/structure.mdx` — covers: FR-006, P-005, SC-003 — route: package — deps: T002

## Phase 2: Tokens

- [ ] T004 [US1] `@stackra/tokens` in `packages/design-system/tokens`: contracts (the schema types) and the `stackra` theme moved from `packages/experience/brand` with its fonts — covers: FR-001, FR-002, P-001, P-002 — route: package — deps: T003
- [ ] T005 [US1] The web and native renderers and the committed CSS in `packages/design-system/tokens`, with the generator-equals-committed test — covers: FR-003, FR-004, P-001, P-003, EC-01 — route: package — deps: T004

## Phase 3: UI

- [x] T006 [US2] @stackra/ui contracts in `packages/design-system/ui/src/contracts` — covers: FR-007 — route: frontend — deps: T004
- [x] T007 [US2] @stackra/ui/react provider on HeroUI v3 (theme, direction, locale; the e2e and react-aria-components catalog entries only as the spec allows) in `pnpm-workspace.yaml` and `packages/design-system/ui/src/react` — covers: FR-008, P-006 — route: frontend — deps: T005, T006
- [x] T008 [US2] @stackra/ui/native provider on HeroUI Native and Uniwind in `packages/design-system/ui/src/native` — covers: FR-009, P-006 — route: frontend — deps: T005, T006

## Phase 4: Playground and e2e

- [x] T009 [US3] `apps/playground` with the switcher and the token foundations route in `apps/playground/src/routes` — covers: FR-010 — route: frontend — deps: T007
- [x] T010 [US3] Playwright and axe e2e over every route in light, dark, LTR and RTL in `apps/playground/e2e/__tests__` — covers: FR-011, P-007, SC-002 — route: tests — deps: T009

## Phase 5: Retire brand

- [ ] T011 [US4] Move the logos and brand assets into `apps/docs` and the app icons into `apps/mobile`, switch `apps/mobile` to `@stackra/tokens`, delete `packages/experience/brand` and clear every reference — covers: FR-005, P-004 — route: package — deps: T005
- [ ] T012 [US4] Package and category READMEs and the roadmap — covers: SC-001 — route: steward-docs — deps: T008, T010, T011
