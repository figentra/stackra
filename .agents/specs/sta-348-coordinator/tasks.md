# Tasks: `@stackra/coordinator` wave 3

**Input**: `.agents/specs/sta-348-coordinator/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-coordinator/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/state/coordinator` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US2] `ElectionMethod`, `LeaderElection`, `ElectLeaderOptions`, `LeaderFlag`, `ElectionMessage`, `ELECTION_PREFIX`, `MEMORY_ELECTIONS` — covers: FR-002, FR-004, FR-006 — route: package — deps: T002
- [x] T004 [US2] `detectElectionMethod`, `electByWebLocks`, `electByBroadcastChannel`, `electInMemory` — covers: FR-003, FR-005, FR-006 — route: package — deps: T003
- [x] T005 [US1] `electLeader` — covers: FR-003, FR-004 — route: package — deps: T004
- [x] T006 [US3] `withTabLock` — covers: FR-002 — route: package — deps: T005
- [x] T007 Stand-in barrel for `.` — covers: FR-002 — route: package — deps: T006
- [x] T008 Tests beside every subject and the barrel test — covers: SC-002 — route: tests — deps: T007
- [x] T009 Changeset `.changeset/coordinator-package.md` — covers: SC-001 — route: package — deps: T007
- [ ] T010 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T008
