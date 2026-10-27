# Tasks: the motion layer

**Input**: `.agents/specs/sta-430-motion-layer/`

## Phase 1: Build

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-430-motion-layer/spec.md` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] The motion steps and `motionTiming` in `packages/design-system/tokens/src/core/functions/motion-timing.function.ts` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] The web `Reveal` in `packages/design-system/ui/src/react/reveal/reveal.tsx` — covers: FR-002, FR-004, P-003 — route: package — deps: T002
- [x] T004 [US1] The native `Reveal` in `packages/design-system/ui/src/native/reveal/reveal.tsx` — covers: FR-003, FR-004, P-003 — route: package — deps: T002
- [x] T005 [US1] `List` reveals its rows in `packages/design-system/ui/src/react/list/list.tsx` and `packages/design-system/ui/src/native/list/list.tsx` — covers: FR-008, EC-01, P-002 — route: package — deps: T003, T004
- [x] T006 [US1] The KPI sparkline in `packages/design-system/ui-pro/src/react/kpi/kpi-chart.tsx` — covers: FR-005, EC-02, P-002 — route: package — deps: T002
- [x] T007 [US1] The native chart series through `packages/design-system/ui-pro/src/native/chart-series/with-defaults.function.ts` — covers: FR-006, EC-02 — route: package — deps: T002
- [x] T008 [US1] The rolling number in `packages/design-system/ui-pro/src/react/number-value/number-value.tsx` — covers: FR-007, EC-03 — route: package — deps: T002
- [x] T009 [US2] ADR 0329 in `apps/docs/src/docs/adr/0329-motion-layer-tokens-reveal-and-animation-on-by-default.mdx` — covers: P-001 — route: adr — deps: T005, T006, T007, T008
