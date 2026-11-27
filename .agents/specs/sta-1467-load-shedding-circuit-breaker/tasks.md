---
description: "Tasks for STA-1467: load shedding (Bulkhead, 503) and circuit breakers on integrations"
---

# Tasks: load shedding (`Bulkhead`, 503) and circuit breakers on integrations

**Input**: Design documents from `.agents/specs/sta-1467-load-shedding-circuit-breaker/`

**Prerequisites**: plan.md, spec.md

## Phase 1: Foundational - the primitives

- [x] T001 `Bulkhead` and its options in `packages/foundation/contracts/src/core/values/bulkhead.value.ts` and `packages/foundation/contracts/src/core/types/bulkhead-options.type.ts` — covers: FR-002, FR-009, AC-001, AC-006, P-001, P-002, NFR-001 — route: spec-task
- [x] T002 `CircuitBreaker`, `CircuitState` and `CircuitTicket` in `packages/foundation/contracts/src/core/values/circuit-breaker.value.ts`, `packages/foundation/contracts/src/core/enums/circuit-state.enum.ts`, `packages/foundation/contracts/src/core/types/circuit-breaker-options.type.ts` and `packages/foundation/contracts/src/core/types/circuit-ticket.type.ts` — covers: FR-007, FR-008, AC-005, P-003, P-004, NFR-001 — route: spec-task
- [x] T003 tests and exports in `packages/foundation/contracts/src/core/values/__tests__/bulkhead.value.test.ts`, `packages/foundation/contracts/src/core/values/__tests__/circuit-breaker.value.test.ts`, `packages/foundation/contracts/src/core/index.ts` and `packages/foundation/contracts/src/core/__tests__/index.test.ts` — covers: AC-007, P-001 to P-004 — route: tests — deps: T001, T002

## Phase 2: User Story 1 - An overloaded instance answers 503 fast (Priority: P1)

**Goal**: one bulkhead in `handlers.run`, the 503 answer through `handlers.shed`.

**Independent Test**: `create-app.function.test.ts` "load shedding".

- [x] T004 [US1] the `HttpConfig` load-shedding keys in `packages/runtime/app/src/core/schemas/http-options.schema.ts`, `packages/runtime/app/src/core/constants/http-config-schema.constant.ts` and `packages/runtime/app/src/config/http.config.ts` — covers: FR-001, FR-005, AC-001, AC-002 — route: spec-task
- [x] T005 [US1] `AppOverloadedError` and `OVERLOAD_RETRY_AFTER_MS` in `packages/runtime/app/src/server/errors/app-overloaded.error.ts` and `packages/runtime/app/src/server/constants/overload-retry-after.constant.ts` — covers: FR-002, AC-001, AC-002 — route: spec-task
- [x] T006 [US1] the bulkhead in `run`, the shed counter and `shed` in `packages/runtime/app/src/server/functions/create-app.function.ts`, `packages/runtime/app/src/server/types/server-handlers.type.ts` and `packages/runtime/app/src/server/index.ts` — covers: FR-002, FR-003, FR-004, FR-005, AC-001, AC-002, AC-003, P-005 — route: spec-task — deps: T004, T005
- [x] T007 [US1] the HTTP adapter answers a shed call through the `shed` handler in `packages/developer/gen/src/core/functions/emit-encore-http.function.ts` and the regenerated HTTP and cron goldens of every gen fixture service — covers: FR-004, AC-003 — route: spec-task — deps: T006
- [x] T008 [US1] tests in `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts`, `packages/runtime/app/src/server/errors/__tests__/app-overloaded.error.test.ts`, `packages/runtime/app/src/config/__tests__/http.config.test.ts`, `packages/runtime/app/src/server/__tests__/index.test.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-encore-http.function.test.ts` — covers: AC-001, AC-002, AC-003, AC-007 — route: tests — deps: T006, T007

## Phase 3: User Stories 2 and 3 - A failing or busy provider is refused fast (Priority: P1, P2)

**Goal**: per-attempt timeout, breaker and bulkhead per Integration and origin.

**Independent Test**: `managed-client.function.test.ts` and `integration-runtime.service.test.ts` "STA-1467".

- [x] T009 [US2] `timeout`, `circuitBreaker`, `concurrency` and their checks in `packages/communication/integrations/src/core/types/integration-options.type.ts` and `packages/communication/integrations/src/core/functions/read-integration-options.function.ts` — covers: FR-012, AC-004, AC-005, AC-006 — route: spec-task
- [x] T010 [US2] `attemptOnce`, `readBody` and the refusal `reason` in `packages/communication/integrations/src/core/functions/managed-client.function.ts`, `packages/communication/integrations/src/core/types/managed-client-options.type.ts` and `packages/communication/integrations/src/core/errors/provider-unavailable.error.ts` — covers: FR-006 to FR-010, AC-004, AC-005, AC-006, P-005, P-006 — route: spec-task — deps: T001, T002, T009
- [x] T011 [US2] guards per Integration and origin in `packages/communication/integrations/src/core/services/integration-runtime.service.ts` — covers: FR-011, AC-005, AC-006 — route: spec-task — deps: T010
- [x] T012 [US2] tests in `packages/communication/integrations/src/core/functions/__tests__/managed-client.function.test.ts`, `packages/communication/integrations/src/core/functions/__tests__/read-integration-options.function.test.ts` and `packages/communication/integrations/src/core/services/__tests__/integration-runtime.service.test.ts` — covers: AC-004, AC-005, AC-006 — route: tests — deps: T010, T011

## Phase 4: Polish

- [x] T013 generated manifests in `apps/playground/stackra.manifest.json`, `workers/edge/stackra.manifest.json`, `packages/foundation/contracts/stackra.manifest.json` and `packages/runtime/app/stackra.manifest.json` — covers: AC-007 — route: spec-task — deps: T003, T006
- [x] T014 [P] READMEs and AGENTS.md in `packages/foundation/contracts/README.md`, `packages/foundation/contracts/AGENTS.md`, `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, `packages/communication/integrations/README.md` and `packages/communication/integrations/AGENTS.md` (and `packages/developer/gen/README.md` for the cron adapter) — covers: FR-001 to FR-013, AC-001, AC-003, AC-004, AC-005, AC-006, AC-008 — route: steward-docs
- [x] T015 [P] changeset for the four packages in `.changeset/load-shedding-circuit-breaker.md` — covers: AC-007 — route: steward-changesets — deps: T013
- [x] T016 cron runs skip the bulkhead: `ServerRunOptions` in `packages/runtime/app/src/server/types/server-run-options.type.ts`, `run(call, options)` in `packages/runtime/app/src/server/functions/create-app.function.ts`, `{ shed: false }` in `packages/developer/gen/src/core/functions/emit-encore-cron-jobs.function.ts`, tests in `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-encore-cron-jobs.function.test.ts`, the regenerated cron goldens of the gen fixtures, and the docs — covers: FR-013, AC-008, P-007 — route: spec-task — deps: T006
- [x] T017 the body read deadline: `bodyReadTimeoutMs` in `packages/runtime/app/src/core/schemas/http-options.schema.ts` and `packages/runtime/app/src/core/constants/http-config-schema.constant.ts`, the signal of `packages/runtime/app/src/server/functions/read-capped-body.function.ts`, the 408 of `packages/runtime/app/src/server/functions/serve-guarded-call.function.ts` and `packages/runtime/app/src/server/types/guarded-call-options.type.ts`, the adapter line in `packages/developer/gen/src/core/functions/emit-encore-http.function.ts` and the HTTP goldens, with tests in `packages/runtime/app/src/server/functions/__tests__/serve-guarded-call.function.test.ts`, `packages/runtime/app/src/server/functions/__tests__/read-capped-body.function.test.ts`, `packages/runtime/app/src/config/__tests__/http.config.test.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-encore-http.function.test.ts` — covers: FR-014, AC-009, EC-07 — route: spec-task — deps: T006, T007
- [x] T018 an answer counts once its body arrived, and a caller that aborts while queued leaves the bulkhead: `packages/foundation/contracts/src/core/values/bulkhead.value.ts` and `packages/communication/integrations/src/core/functions/managed-client.function.ts`, with tests in `packages/foundation/contracts/src/core/values/__tests__/bulkhead.value.test.ts` and `packages/communication/integrations/src/core/functions/__tests__/managed-client.function.test.ts` — covers: FR-007, FR-010, FR-015, AC-010 — route: spec-task — deps: T001, T010
- [x] T019 a circuit per connection: `by` in `packages/communication/integrations/src/core/types/integration-options.type.ts`, its check in `packages/communication/integrations/src/core/functions/read-integration-options.function.ts`, the keying in `packages/communication/integrations/src/core/services/integration-runtime.service.ts` and the docs of `packages/communication/integrations/src/core/enums/rate-limit-scope.enum.ts`, with tests in `packages/communication/integrations/src/core/services/__tests__/integration-runtime.service.test.ts` and `packages/communication/integrations/src/core/functions/__tests__/read-integration-options.function.test.ts` — covers: FR-016, AC-011, EC-08 — route: spec-task — deps: T011
- [x] T020 Test first, then pass `ServerRunOptions.signal` to `Bulkhead#enter` in `packages/runtime/app/src/server/functions/create-app.function.ts` (`packages/runtime/app/src/server/types/server-run-options.type.ts`), and have the generated HTTP adapter abort its request when the client closes the connection and pass `request.signal` in `packages/developer/gen/src/core/functions/emit-encore-http.function.ts`, with tests in `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts` and `packages/developer/gen/src/core/functions/__tests__/emit-encore-http.function.test.ts` and the regenerated goldens (every `http.ts.golden` under `packages/developer/gen/__golden__/`, among them `packages/developer/gen/__golden__/service/expected/services/shop/stackra-encore/shop/http.ts.golden`) — covers: FR-017, P-010, AC-012 — route: package
