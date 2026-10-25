# Tasks: `@stackra/market-packs`

**Input**: `.agents/specs/sta-348-market-packs/`

- [x] T001 Spec, plan and tasks — covers: SC-001 — route: spec-draft
- [x] T002 Member files in `packages/foundation/market-packs` (package.json, tsconfig, turbo.jsonc, stackra.config.ts, tool configs, README, AGENTS, LICENSE, CHANGELOG) — covers: FR-001 — route: package — deps: T001
- [x] T003 Enums `PackStatus`, `FloorBound`, `PackRejection`; refusals `PackRejectedError`, `PackNotFoundError` — covers: FR-003, FR-006, FR-007 — route: package — deps: T002
- [x] T004 `MarketPack$`, `SignedPack$` and the types — covers: FR-005, FR-007, FR-008, FR-009, FR-010 — route: package — deps: T003
- [x] T005 `canonicalJson`, `contentHash`, `signPack`, `verifyPack` — covers: FR-003 — route: package — deps: T004
- [x] T006 `compareVersions`, `pickPack`, `resolvePack` — covers: FR-004, FR-006, FR-009 — route: package — deps: T004
- [x] T007 `valuesOn`, `valueOf`, `floorsOn`, `factsOn` — covers: FR-004, FR-005, FR-007 — route: package — deps: T006
- [x] T008 `unreviewed`, `launchGate` — covers: FR-008 — route: package — deps: T004
- [x] T009 Stand-in barrel and tests beside every subject — covers: FR-002, FR-011, SC-002 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/market-packs-package.md` and ADR 0370 — covers: SC-001 — route: package — deps: T009
- [ ] T011 Run the package's tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T009
