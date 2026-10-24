# Tasks: `@stackra/csp` wave 2

**Input**: `.agents/specs/sta-348-csp/`

- [x] T001 Spec, plan and tasks in `.agents/specs/sta-348-csp/` — covers: SC-001 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE) in `packages/security/csp` — covers: FR-001 — route: package — deps: T001
- [x] T003 [US2] `CspOptions`, `CSP_OPTIONS_SCHEMA`, `CSP_SOURCE_PATTERN`, `CspConfig` — covers: FR-004 — route: package — deps: T002
- [x] T004 [US1] `CSP_BASELINE`, `CSP_NONCE_PATTERN`, `cspSource`, `contentSecurityPolicy`, `cspHeaderName`, `createNonce`, `CspAdditions` — covers: FR-002, FR-005, FR-006 — route: package — deps: T003
- [x] T005 [US3] `./react` `NonceProvider`, `useNonce`, `Style` and their props — covers: FR-003 — route: package — deps: T002
- [x] T006 Stand-in barrels for both entries — covers: FR-002, FR-003 — route: package — deps: T004, T005
- [x] T007 Tests beside every subject and the barrel tests — covers: SC-002, SC-003 — route: tests — deps: T006
- [x] T008 Changeset `.changeset/csp-package.md` — covers: SC-001 — route: package — deps: T006
- [ ] T009 `pnpm install` to link the new member (and Changesets to write `CHANGELOG.md`), then its tests, typecheck and build in the separate testing workflow — covers: SC-002 — route: tests — deps: T007
