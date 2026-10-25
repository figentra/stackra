# Tasks: `@stackra/identity` wave 6

**Input**: `.agents/specs/sta-348-identity/`

- [x] T001 [US1] Spec, plan and tasks in `.agents/specs/sta-348-identity/` — covers: SC-001 — route: spec-draft
- [x] T002 [US1] Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/security/identity` — covers: FR-001, P-001 — route: package — deps: T001
- [x] T003 [US3] `IdentityConfig`, `IdentityOptions`, `IDENTITY_CONFIG_SCHEMA`, `AuthFlow`, `SessionStatus` and the refusals in `packages/security/identity/src/config/` and `src/core/` — covers: FR-002, P-002 — route: package — deps: T002
- [x] T004 [US1] `SessionStore`, `SignInBrowser`, `SessionUser` in `packages/security/identity/src/contracts/`, and `BffSessionStoreDriver` with the session-user schema in `src/core/` — covers: FR-003, P-003 — route: package — deps: T003
- [x] T005 [US2] `PkceSessionStoreDriver` and the PKCE helpers in `packages/security/identity/src/core/drivers/` and `src/core/functions/` — covers: FR-004, P-004 — route: package — deps: T004
- [x] T006 [US2] `IDENTITY_CLAIMS` and `sessionUserOf` in `packages/security/identity/src/core/` — covers: FR-005, P-005 — route: package — deps: T004
- [x] T007 [US4] `SessionService` and `MemorySessionStoreDriver` in `packages/security/identity/src/core/` — covers: FR-006, P-006 — route: package — deps: T005, T006
- [x] T008 [US3] `useSession`, `SessionValue`, `SignedInSession` in `packages/security/identity/src/react/session/` — covers: FR-007, P-007 — route: package — deps: T007
- [x] T009 [US5] `SessionClientSessionDriver` in `packages/security/identity/src/core/drivers/` — covers: FR-008, P-008 — route: package — deps: T007
- [x] T010 [US6] `MemoryIdentityResolverDriver`, `fakeIdentity`, `fakeSession` and `SessionFake` in `packages/security/identity/src/core/drivers/` and `src/testing/` — covers: FR-009, P-009 — route: package — deps: T008
- [x] T011 [US1] Tests for every public symbol and each barrel in `src/**/__tests__/` — covers: SC-002 — route: tests — deps: T010
- [x] T012 [US1] Changeset `.changeset/identity-package.md`; `oxfmt` and `oxlint` clean; the validator reports nothing for the package — covers: SC-001, SC-003 — route: package — deps: T011
- [ ] T013 [US1] Run the package's tests, typecheck and build in the separate testing workflow after the integrator's install — covers: SC-002, SC-003 — route: tests — deps: T012
- [x] T014 [US1] R3 reconciliation: `IDENTITY_CLAIMS.scopePath` is `@stackra/scope`'s `SCOPE_PATH_CLAIM`, and `SessionService` sets every state's permission keys into `@stackra/iam`'s `PermissionSnapshotService` in `packages/security/identity/src/core/` — covers: FR-005, P-005, FR-006, P-006 — route: package — deps: T012
