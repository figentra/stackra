# Tasks: `@stackra/segments` wave 7

**Input**: `.agents/specs/sta-348-segments/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-segments/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/application/segments` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US1] `SegmentKind`, `SegmentRef`, `SubjectRef` and `SegmentSubject` in `packages/application/segments/src/contracts/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `MembershipEntered`, `MembershipLeft`, their shipped schema and `SegmentKindMismatchError` in `packages/application/segments/src/core/` — covers: FR-006, P-006, FR-007, P-007 — route: package — deps: T003
- [x] T005 [US1] `Segment`, `SegmentMembership` and `CreateSegmentsMigration` in `packages/application/segments/src/node/` — covers: FR-003, P-003, FR-008, P-008 — route: package — deps: T003
- [x] T006 [US4] `SegmentMembershipService` (reads, `enter`, `leave`) — covers: FR-003, P-003, FR-006, P-006 — route: package — deps: T004, T005
- [x] T007 [US1] `SegmentService` (create, draft, publish, add, remove, recompute, recomputeSubject, queueRecomputes, connect) — covers: FR-002, P-002, FR-004, P-004, FR-007, P-007 — route: package — deps: T006
- [x] T008 [US2] `RecomputeSegmentsAction`, `RecomputeSegmentsInput`, `SubjectChangeService` and `registerSegmentSubjects` — covers: FR-005, P-005 — route: package — deps: T007
- [x] T009 [US2] `SEGMENTS_TESTING_PLUGIN` in `packages/application/segments/src/testing/` — covers: FR-005, P-005 — route: package — deps: T007
- [x] T010 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T009
- [x] T011 [US1] Changeset `.changeset/segments-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T010
- [ ] T012 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T011
