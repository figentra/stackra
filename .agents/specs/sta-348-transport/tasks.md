# Tasks: `@stackra/transport` wave 2

**Input**: `.agents/specs/sta-348-transport/`

- [x] T001 Member files: `package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, `tsdown.config.ts`, `vitest.config.ts`, README, AGENTS, LICENSE, CHANGELOG — covers: FR-001, FR-005 — route: package
- [x] T002 Types: `Transport`, `Middleware`, `TransportOptions`, `RetryOptions`, `ServerSentEvent`, `TokenSource` — covers: FR-002 — route: package — deps: T001
- [x] T003 `TRANSPORT_HEADERS`, `SAFE_METHODS`, `IDEMPOTENT_METHODS`, `RETRYABLE_STATUSES` — covers: FR-002, FR-004 — route: package — deps: T001
- [x] T004 `createTransport` and its test — covers: FR-002 — route: package — deps: T002
- [x] T005 `bearerToken`, `idempotencyKey`, `stackraVersion` (with `withHeader`) and their tests — covers: FR-002 — route: package — deps: T004
- [x] T006 `RequestTimedOutError`, `timeout` and their tests — covers: FR-002 — route: package — deps: T004
- [x] T007 `retry` (with `wait`, `retryAfter`, `isSafeToRepeat`) and its tests — covers: FR-002, FR-004, SC-002 — route: package — deps: T003, T004
- [x] T008 `readLines`, `readNdjson`, `readServerSentEvents` and their tests — covers: FR-002 — route: package — deps: T002
- [x] T009 `packages/foundation/transport/src/native` `nativeFetch` and its test — covers: FR-003 — route: package — deps: T004
- [x] T010 Barrels and barrel tests; changeset — covers: FR-001, FR-002, FR-003, SC-001 — route: tests — deps: T005, T006, T007, T008, T009
- [ ] T011 Run the tests, typecheck and build (testing workflow) — covers: SC-001 — route: tests — deps: T010
