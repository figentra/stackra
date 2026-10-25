# Tasks: `@stackra/analytics` wave 4

**Input**: `.agents/specs/sta-348-analytics/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-analytics/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/cross-cutting/analytics` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `AnalyticsDriver` and `AnalyticsDelivery` in `packages/cross-cutting/analytics/src/contracts` — covers: FR-003, P-003 — route: package — deps: T002
- [x] T004 [US4] `AnalyticsState`, `AnalyticsDriverName`, `AnalyticsOptions`, the shipped schema and `AnalyticsConfig` in `packages/cross-cutting/analytics/src/core` and `packages/cross-cutting/analytics/src/config` — covers: FR-002, FR-006, P-006 — route: package — deps: T003
- [x] T005 [US1] [US2] `AnalyticsClient` and `NoneAnalyticsDriver` in `packages/cross-cutting/analytics/src/core` — covers: FR-004, FR-005, P-004, P-005 — route: package — deps: T004
- [x] T006 [US3] `useAnalytics` in `packages/cross-cutting/analytics/src/react`; `AnalyticsFake`, `MemoryAnalyticsDriver` and `fakeAnalytics` in `packages/cross-cutting/analytics/src/testing` — covers: FR-003 — route: package — deps: T005
- [x] T007 Stand-in barrels for the four entries — covers: FR-001, FR-002, FR-003, P-002 — route: package — deps: T006
- [x] T008 Tests beside every subject and each barrel's test — covers: SC-002, P-002, P-004, P-005 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/analytics-package.md`; `oxfmt`, `oxlint` and `validate-repository.mjs` clean — covers: SC-001, SC-003 — route: package — deps: T008
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T008
