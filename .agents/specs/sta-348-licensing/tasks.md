# Tasks: `@stackra/licensing`

**Input**: `.agents/specs/sta-348-licensing/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-licensing/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/security/licensing` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US2] `LicenceStanding`, `Licence` and the option and verdict types — covers: FR-002 — route: package — deps: T002
- [x] T004 [US1] [US3] `LicenceFileInvalidError`, `LicenceCheckUnavailableError` — covers: FR-002 — route: package — deps: T002
- [x] T005 [US1] `verifyLicenceFile` with `decodeBase64`, `decryptLicence`, `readLicence`, `isRecord` — covers: FR-002, FR-003 — route: package — deps: T003, T004
- [x] T006 [US2] `licenceStanding` — covers: FR-002, FR-004 — route: package — deps: T003
- [x] T007 [US3] `checkLicenceKey` — covers: FR-002, FR-004 — route: package — deps: T004
- [x] T008 Stand-in barrel for `.` — covers: FR-002 — route: package — deps: T005, T006, T007
- [x] T009 Tests beside every subject, the signed-file fixture and the barrel test — covers: SC-002 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/licensing-package.md` — covers: SC-001 — route: package — deps: T008
- [ ] T011 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-002, SC-003 — route: tests — deps: T009
