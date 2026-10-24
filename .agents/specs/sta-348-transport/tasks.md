# Tasks: `@stackra/transport` wave 2

**Input**: `.agents/specs/sta-348-transport/`

- [x] T001 Member files: `package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, `tsdown.config.ts`,
      `vitest.config.ts`, README, AGENTS, LICENSE, CHANGELOG
- [x] T002 Types: `Transport`, `Middleware`, `TransportOptions`, `RetryOptions`, `ServerSentEvent`, `TokenSource`
- [x] T003 `TRANSPORT_HEADERS`, `SAFE_METHODS`, `IDEMPOTENT_METHODS`, `RETRYABLE_STATUSES`
- [x] T004 `createTransport` and its test
- [x] T005 `bearerToken`, `idempotencyKey`, `stackraVersion` (with `withHeader`) and their tests
- [x] T006 `RequestTimedOutError`, `timeout` and their tests
- [x] T007 `retry` (with `wait`, `retryAfter`, `isSafeToRepeat`) and its tests
- [x] T008 `readLines`, `readNdjson`, `readServerSentEvents` and their tests
- [x] T009 `./native` `nativeFetch` and its test
- [x] T010 Barrels and barrel tests; changeset
- [ ] T011 Run the tests, typecheck and build (testing workflow)
