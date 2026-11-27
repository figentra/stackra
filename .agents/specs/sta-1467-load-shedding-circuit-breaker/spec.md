# Feature Specification: load shedding (`Bulkhead`, 503) and circuit breakers on integrations

**Feature Branch**: `figentra/sta-1467-load-shedding-circuit-breaker`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R2)

**Linear**: STA-1467

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the 2026-10-28 data-layer gap analysis (stackra-308, gap sc12) and the 2026-11-26 production-readiness audit
(batch 15, item 15.4): a slow provider or an overload cascades into whole-service failure. On `origin/main` the server
`createApp` runs every call it is handed, however many are in flight, and the integrations managed client sends every
attempt with no timeout of its own and no memory of a provider that keeps failing, so each caller waits for the
provider's own timeout and the backlog grows until the process stalls.

## Impact

- **Apps touched**: apps/playground (`stackra.manifest.json`, generated: the new error code)
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts (`Bulkhead`, `CircuitBreaker`, `CircuitState` and their option and ticket types), packages/runtime/app (`HttpConfig` bulkhead keys and body read deadline, `handlers.run` admission, `handlers.shed`, `AppOverloadedError`, the 408 of `serveGuardedCall`), packages/communication/integrations (per-attempt `timeout`, `circuitBreaker` (with `by`) and `concurrency` options, the runtime's breaker and bulkhead per Integration and origin, `ProviderUnavailableError.reason`), packages/developer/gen (the HTTP adapter answers a shed call through `handlers.shed` and passes the body read deadline; the cron adapter runs with `{ shed: false }`)
- **Public contract change**: additive: `Bulkhead`, `CircuitBreaker`, `CircuitState`, `BulkheadOptions`, `CircuitBreakerOptions`, `CircuitTicket` exported from `@stackra/contracts`; `AppOverloadedError` (code `app_overloaded`, kind `unavailable`), `ServerHandlers.shed` and the optional second argument of `ServerHandlers.run` (`ServerRunOptions.shed`) from `@stackra/app/server`; config keys `app.http.maxConcurrentCalls` (1024), `app.http.maxQueuedCalls` (1024), `app.http.maxQueueWaitMs` (5000), `app.http.bodyReadTimeoutMs` (30000); the optional `GuardedCallOptions.bodyReadTimeoutMs` and the optional `signal` of `Bulkhead#enter`; `IntegrationOptions.timeout`, `.circuitBreaker` (with `by: RateLimitScope`), `.concurrency`; `ProviderUnavailableError.reason`; the manifests list the new error code and enum. Behaviour change by default: a server sheds past 1024 calls in flight plus 1024 queued, an HTTP body slower than 30 s is answered 408, an integration attempt is aborted at 30 s, and a provider's circuit opens after 5 failures in a row for 30 s.
- **Cross-service events**: none
- **Tenancy and data**: none stored (counters in process memory; breakers and bulkheads keyed by Integration class name and origin, and a circuit `by` credential also by the connection id or `platform`, never a credential value). By default one circuit is shared by every tenant's connections to an origin; `by: RateLimitScope.Credential` isolates tenants (FR-016)
- **Security and privacy**: a shed refusal carries only its wait; `ProviderUnavailableError` carries the provider, last status, wait and reason, never a credential or body; the shed 503 carries the CORS headers of the bound `CorsConfig` only (an allowed origin is echoed, never another)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0140: `Unavailable` is 503 and retryable; ADR 0308 rule 13: the managed client turns a provider outcome into a value or a refusal; ADR 0143 decision 3: a drain waits for what it admitted)
- **New dependencies**: none
- **Deploy modes**: same in all three (in-process only; no outbound call or store added)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: packages/foundation/contracts/README.md, packages/foundation/contracts/AGENTS.md, packages/runtime/app/README.md, packages/runtime/app/AGENTS.md, packages/communication/integrations/README.md, packages/communication/integrations/AGENTS.md
- **Lane**: full
- **Change risk**: R2 (request path of every server call; no auth, secret or data change)

## Discovery

- **Current behaviour**: `createApp`'s `handlers.run` refuses only while draining (`AppDrainingError`) and otherwise
  starts every call at once (SRC-001). The managed client's `exchange` loop calls `fetch(url, init)` with the caller's
  signal only, retries transient outcomes with backoff, and keeps no state between calls (SRC-002).
  `IntegrationRuntime` makes a fresh managed client per call (SRC-003).
- **Topology**: the generated Encore HTTP, Pub/Sub, queue and cron adapters reach the member only through
  `app.handlers.run` (SRC-004); the HTTP adapter is emitted by `emitEncoreHttp`; probes (`/healthz`, `/readyz`) go
  through `probe()`, never `run`.
- **Dependencies**: the `Clock` port for the breaker's time; the optional `Metrics` port for the shed counter; the
  `CorsConfig` binding for the 503's CORS headers (SRC-001, SRC-005).
- **Ownership**: core maintainers (runtime, communication, foundation and developer packages).
- **Constraints already decided**: ADR 0140 (error kinds and envelope), ADR 0143 decision 3 (drain), ADR 0295
  decision 8 (adapters through `handlers`), ADR 0308 rules 4, 6 and 13 (managed client), ADR 0294 decisions 19, 20
  and 26 (configuration classes and schemas), owner D10 2026-10-28 (lengths are `Duration`s) (SRC-005).

### Sources

- **SRC-001**: `packages/runtime/app/src/server/functions/create-app.function.ts` on `origin/main`: `run` starts every call, and `serveGuardedCall` reads a body with no deadline (FR-001 to FR-005, FR-013, FR-014)
- **SRC-002**: `packages/communication/integrations/src/core/functions/managed-client.function.ts` on `origin/main`: no timeout, no breaker (FR-006 to FR-010, FR-012)
- **SRC-003**: `packages/communication/integrations/src/core/services/integration-runtime.service.ts` on `origin/main`: a client per call, nothing shared (FR-011, FR-016)
- **SRC-004**: `packages/developer/gen/src/core/functions/emit-encore-http.function.ts`, `emit-encore-events.function.ts`, `emit-encore-queues.function.ts`, `emit-encore-cron-jobs.function.ts` on `origin/main` (FR-004, FR-013, FR-014)
- **SRC-005**: ADR 0140, ADR 0143, ADR 0294, ADR 0295, ADR 0308 in `apps/docs/src/docs/adr/` (FR-015)
- **SRC-006**: STA-1467 (stackra-308) and the 2026-11-26 readiness audit, item 15.4

## Glossary

- **Bulkhead**: a bounded compartment: at most `limit` calls hold a place, `queue` more wait (first come, first served) for at most `maxWaitMs`, any other is turned away at once.
- **Circuit breaker**: per dependency: `failureThreshold` failures in a row open it; open, it refuses every call for `cooldownMs`; then it half opens and lets `halfOpenProbes` trial calls through, which close or reopen it.
- **Shed**: a call turned away before it starts, so it is safe to send again.

## User Scenarios & Testing

### User Story 1 - An overloaded instance answers 503 fast (Priority: P1)

An operator's API instance receives more calls than it can run. Past the bulkhead and its queue, callers get 503 with
`Retry-After: 1` at once instead of every call slowing down until the instance stalls, and probes stay green.

**Why this priority**: an overload must not take the whole service down.

**Independent Test**: `create-app.function.test.ts` "load shedding".

**Acceptance Scenarios**:

1. **Given** `maxConcurrentCalls: 2, maxQueuedCalls: 1`, **When** four calls arrive at once, **Then** two run, one waits, and the fourth is refused with `AppOverloadedError`, answered 503 with the envelope, `Retry-After: 1`, `Cache-Control: no-store` and the CORS headers.

### User Story 2 - A failing provider is refused in microseconds (Priority: P1)

A provider starts timing out. After 5 failed attempts in a row its circuit opens, and for 30 s every call to it is
refused with `ProviderUnavailableError` (`reason: "circuit_open"`, the wait) without being sent; one trial call then
decides whether it closes.

**Why this priority**: one slow provider must not hold every caller for its timeout.

**Independent Test**: `managed-client.function.test.ts` and `integration-runtime.service.test.ts` "STA-1467".

**Acceptance Scenarios**:

1. **Given** an Integration with defaults, **When** 5 attempts in a row get no answer, time out or answer 408 / 5xx, **Then** the next call is refused without a request, and after 30 s one trial goes.

### User Story 3 - A provider's concurrency is bounded (Priority: P2)

An Integration states `concurrency: { limit, queue, maxWait }`; attempts past it are refused with
`reason: "bulkhead_full"` without being sent.

**Independent Test**: `managed-client.function.test.ts` "refuses an attempt without sending it while the provider's bulkhead is full".

### Edge Cases

- **EC-01**: a call admitted while closed that fails after the circuit opened does not extend the cooldown, and its late success does not close it.
- **EC-02**: a 429 says nothing about the provider's health (neither failure nor success); a 4xx is an answer.
- **EC-03**: the caller's own abort throws the caller's reason, is not counted against the provider, and leaves no timer.
- **EC-04**: a queued server call counts as in flight, so a drain waits for it; a draining refusal is answered 503 without a wait.
- **EC-05**: a shed Pub/Sub delivery or queue job rejects, so its transport retries it. A cron run is never shed:
  Encore does not retry a failed CronJob invocation and `SchedulerService.fire` moves no watermark (the SaaS minute tick
  runs with `crons: false`), so a shed run would be lost for good; the generated cron adapter runs with
  `{ shed: false }` and skips the bulkhead (FR-013).
- **EC-06**: the breakers and bulkheads are per instance; N instances let N × the threshold of failures through before every one opens.
- **EC-07**: an HTTP call reads its body while it holds its bulkhead place, so slow uploads could fill the bulkhead; the body read deadline (FR-014) bounds how long one can hold it.
- **EC-08**: a shared circuit lets one tenant's failing calls shed every tenant's calls to that origin on the instance until the cooldown; an Integration whose failures follow the account keys its circuit `by` credential (FR-016).

## Requirements

### Functional Requirements

- **FR-001** (example-only): THE `HttpConfig` SHALL carry `maxConcurrentCalls` (0 to 1,000,000, default 1024), `maxQueuedCalls` (0 to 1,000,000, default 1024) and `maxQueueWaitMs` (0 to 60,000, default 5000). Sources: SRC-001, SRC-005
- **FR-002**: WHILE `maxConcurrentCalls` is above 0 THE `handlers.run` SHALL admit every call through one `Bulkhead` of that limit, queue and wait, and refuse a call turned away with `AppOverloadedError` (`retryAfterMs` 1000) before its request container exists. Sources: SRC-001
- **FR-003** (example-only): WHEN a call is shed THE app SHALL count `app.calls.shed` (`reason: overloaded`) on the bound `Metrics`. Sources: SRC-001
- **FR-004** (example-only): WHEN `run` rejects with `AppOverloadedError` or `AppDrainingError` THE generated HTTP adapter SHALL answer through `handlers.shed`: 503, the refusal's envelope, `Retry-After` in whole seconds when it names a wait, `Cache-Control: no-store` and the CORS headers; any other error SHALL propagate unchanged. Sources: SRC-004
- **FR-005** (example-only): WHILE `maxConcurrentCalls` is 0 THE app SHALL shed nothing. Sources: SRC-001
- **FR-006**: THE managed client SHALL abort each attempt at the Integration's `timeout` (30 s by default), the body read included, and refuse a call whose last attempt timed out with `reason: "timeout"`. Sources: SRC-002
- **FR-007**: WHEN an attempt gets no answer, times out or answers 408 or a 5xx THE managed client SHALL report a failure to the origin's breaker; a 429 SHALL release its ticket; any other answer SHALL report success only once its body was read in full, and a failure when the body read times out or breaks (an answer dropped unread releases the ticket). Sources: SRC-002
- **FR-008**: WHILE the origin's circuit is open THE managed client SHALL refuse without sending, with `ProviderUnavailableError` carrying `reason: "circuit_open"`, the wait and the previous attempt's status. Sources: SRC-002
- **FR-009**: WHEN the origin's bulkhead and its queue are full THE managed client SHALL refuse without sending, with `reason: "bulkhead_full"`. Sources: SRC-002
- **FR-010**: WHEN the caller's signal aborts THE managed client SHALL throw the caller's reason, release its ticket and bulkhead place, and clear its timer; an attempt queued for the bulkhead SHALL leave the queue at once (`Bulkhead#enter(signal)`). Sources: SRC-002
- **FR-011**: THE `IntegrationRuntime` SHALL keep one breaker (5 failures, 30 s unless the Integration states `circuitBreaker`, none with `false`) and one bulkhead (only with `concurrency`) per Integration and origin, shared by every client of it. Sources: SRC-003
- **FR-012** (example-only): THE `readIntegrationOptions` SHALL refuse on import a `timeout` that is not a positive `Duration`, a `circuitBreaker` without a whole threshold from 1 or with a zero cooldown, and a `concurrency` without a limit from 1 or with a negative queue. Sources: SRC-002
- **FR-014**: WHILE `HttpConfig.bodyReadTimeoutMs` (0 to 600,000, default 30,000) is above 0 THE `serveGuardedCall` SHALL read the request body within that many milliseconds and otherwise answer 408 (`request_timeout`, `unavailable`, retryable, `Connection: close`) before any guard runs and clear its timer; THE generated HTTP adapter SHALL pass the configured deadline. Sources: SRC-001, SRC-004
- **FR-015** (example-only): WHEN a waiter's signal aborts THE `Bulkhead` SHALL remove it from the queue, clear its timer and resolve `undefined`; a signal already aborted SHALL take no place. Sources: SRC-005
- **FR-016**: WHERE an Integration states `circuitBreaker.by: RateLimitScope.Credential` THE `IntegrationRuntime` SHALL keep one breaker per connection (and one for the platform's own credentials) on each origin instead of one shared breaker; the bulkhead stays per Integration and origin. Sources: SRC-003
- **FR-013**: WHEN `handlers.run` is called with `{ shed: false }` THE app SHALL start the call without the bulkhead, never refuse it as overloaded, still count it in flight and still refuse it while draining; THE generated cron adapter SHALL call `run` that way for every CronJob. Sources: SRC-001, SRC-004

### Non-functional Requirements

- **NFR-001**: THE `Bulkhead` and `CircuitBreaker` SHALL be isomorphic, in memory, deterministic under an injected time, and never throw while running. Sources: SRC-005
- **NFR-002**: THE refusals SHALL carry no credential, body, caller or count. Sources: SRC-005

### Key Entities

- **Guard key**: `<Integration class name>:<origin>` (`Resend:https://api.resend.com`), in process memory; a circuit `by` credential is keyed `<Integration class name>:<connection id | platform>:<origin>`.

## Acceptance criteria

- **AC-001**: WHEN more calls arrive than `maxConcurrentCalls` + `maxQueuedCalls` THE app SHALL refuse the excess with `AppOverloadedError` at once and run the rest in arrival order.
- **AC-002**: WHEN a queued call waits past `maxQueueWaitMs` THE app SHALL refuse it with `AppOverloadedError`.
- **AC-003**: WHEN the HTTP adapter's `run` rejects with a shed or draining refusal THE answer SHALL be 503 with the envelope, `Retry-After` (shed only), `no-store` and the CORS headers.
- **AC-004**: WHEN an attempt passes its `timeout` THE managed client SHALL abort it and, once the retries are spent, refuse with `reason: "timeout"`.
- **AC-005**: WHEN 5 attempts in a row to one origin fail THE next call SHALL be refused without a request until the cooldown passes, and a trial then closes or reopens the circuit.
- **AC-006**: WHEN an Integration states `concurrency` THE attempts past it SHALL be refused with `reason: "bulkhead_full"` without a request.
- **AC-007**: THE barrels SHALL export the new values and types, and the manifests SHALL list `app_overloaded` and `contracts.CircuitState`.
- **AC-008**: WHEN the bulkhead and its queue are full THE app SHALL still start a cron run (`{ shed: false }`) at once, and a drain SHALL wait for it.
- **AC-009**: WHEN a request body has not arrived in full within `bodyReadTimeoutMs` THE answer SHALL be 408 before any guard runs, with no timer left.
- **AC-010**: WHEN a provider sends its headers and then stalls past the `timeout` THE attempt SHALL count as a failure of the circuit; WHEN a caller aborts while its attempt is queued for the bulkhead THE call SHALL throw the caller's reason at once and leave the queue.
- **AC-011**: WHEN an Integration keys its circuit `by` credential and one connection's calls open it THE other connections and the platform's own credentials SHALL still send.

## Success Criteria

- **SC-001**: every requirement has a unit test that fails with its production file put back to `origin/main` — verified by: unit (the revert check in the pull request)
- **SC-002**: a provider that never answers costs a caller at most the breaker's refusal (microseconds) once the circuit is open — verified by: unit (`managed-client.function.test.ts`)

## Out of scope

- A circuit or bulkhead shared across instances (a distributed breaker in a cache).
- Shedding by priority or tenant (every call shares one compartment; only the circuit can be keyed per connection).
- Adaptive limits (concurrency computed from latency).

## Assumptions

- The defaults (1024 + 1024, 5 s wait; 5 failures, 30 s; 30 s attempt timeout) suit a typical instance; a host overrides them in `HttpConfig` or the Integration's options.

## Amendments

- 2026-11-27 · review finding (medium): cron runs no longer pass the bulkhead. EC-05 said a shed cron tick is retried
  by its transport; Encore never retries a failed CronJob invocation, so a shed daily action would be lost. Added
  `ServerRunOptions.shed`, FR-013, AC-008 and T016.

- 2026-11-27 · review findings (low, three): a slow upload held its bulkhead place without bound (FR-014, AC-009);
  a provider that sent headers and then stalled never opened the circuit, and a caller that aborted while queued
  stayed in the queue (FR-007, FR-010, FR-015, AC-010); one tenant's failures opened a shared circuit for every
  tenant (FR-016, EC-08, AC-011). Added T017 to T019.

## Status history

- 2026-11-27 · — → Draft · spec author · written from the branch's diff
- 2026-11-27 · Draft → Clarified · spec author · questions answered from the diff and ADRs 0140, 0143, 0308
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built on the branch, tasks ticked)
