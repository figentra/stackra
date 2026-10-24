# Tasks: `@stackra/consent` wave 3

**Input**: `.agents/specs/sta-348-consent/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-consent/` — covers: SC-001, SC-002 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG, `packages/security/consent/assets/lang`) in `packages/security/consent` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US1] [US3] `ConsentStore` and `ConsentRecord` in `packages/security/consent/src/contracts/` — covers: FR-003 — route: package — deps: T002
- [x] T004 [US4] Enums, `ConsentCategoryEntry`, `ConsentOptions`, `CONSENT_CONFIG_SCHEMA`, `ConsentConfig` — covers: FR-002 — route: package — deps: T002
- [x] T005 [US1] [US3] `CONSENT_RECORD_SCHEMA`, `parseConsentRecord`, the cookie, storage and memory drivers — covers: FR-002, FR-005 — route: package — deps: T003, T004
- [x] T006 [US1] [US2] `hasGlobalPrivacyControl`, `ConsentLedger` — covers: FR-004 — route: package — deps: T005
- [x] T007 [US1] [US3] `useConsent`, `CategoryConsent`, `ConsentState`, `fakeConsent` — covers: FR-003, FR-006 — route: package — deps: T006
- [x] T008 Stand-in barrels for the four entries — covers: FR-001, FR-002, FR-003 — route: package — deps: T007
- [x] T009 Tests beside every subject and the barrel tests — covers: SC-003 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/consent-package.md` — covers: SC-002 — route: package — deps: T008
- [ ] T011 `pnpm install` to link the new member, then its tests, typecheck and build in the separate testing workflow — covers: SC-003, SC-004 — route: tests — deps: T009
