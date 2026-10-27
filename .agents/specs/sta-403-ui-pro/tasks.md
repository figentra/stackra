# Tasks: `@stackra/ui-pro`, private HeroUI Pro wrappers for Stackra's own apps

**Input**: `.agents/specs/sta-403-ui-pro/`

## Phase 1: Package, rules and decisions

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-403-ui-pro/spec.md` — covers: SC-001 — route: spec-draft
- [x] T002 [US2] Scaffold `packages/design-system/ui-pro` (private), the catalog lines and `allowBuilds` in `pnpm-workspace.yaml`, and the Pro dependency check in `tools/scripts/validate-repository.mjs` with its test — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] ADR 0310 and the ADR 0197 note in `apps/docs/src/docs/adr` — covers: FR-001, FR-014 — route: adr — deps: T001
- [x] T004 [US1] CI install with `HEROUI_AUTH_TOKEN` over OIDC and the release build scope in `.github/workflows/ci.yml` and `.github/workflows/release.yml` — covers: FR-014, P-004, EC-01 — route: ci-permissions — deps: T002

## Phase 2: Components

- [x] T005 [P] [US1] Web wrappers DataGrid, ActionPalette, Sidebar, AppLayout, Kanban, Kpi, TrendChip with contracts and tests in `packages/design-system/ui-pro/src/react` — covers: FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, P-002, EC-02 — route: package — deps: T002
- [x] T006 [P] [US1] Native wrappers ProgressButton, SlideButton, SwipeableRow, Calendar, DatePicker, NumberField with contracts and tests in `packages/design-system/ui-pro/src/native` — covers: FR-002, FR-008, FR-009, FR-010, FR-011, FR-012, P-002, EC-02 — route: package — deps: T002

## Phase 3: Playground and gate

- [x] T007 [US3] Pro routes, the "Pro" navigation group and one e2e file per web component in `apps/playground` — covers: FR-013, P-003, SC-002 — route: frontend — deps: T005
- [x] T009 [US3] The design-system review area, its native Pro screens, the provider and Metro singletons, and deep links in `apps/mobile` — covers: FR-015, P-005 — route: mobile — deps: T006
- [x] T008 [US1] Barrels, README, AGENTS and a full `pnpm verify` plus the playground e2e in `packages/design-system/ui-pro` — covers: SC-001 — route: package — deps: T003, T006, T007, T009
