# Implementation Plan: load shedding (`Bulkhead`, 503) and circuit breakers on integrations

**Spec**: `.agents/specs/sta-1467-load-shedding-circuit-breaker/spec.md` · **Linear**: STA-1467 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-1467-load-shedding-circuit-breaker/spec.md`

## Summary

Two in-memory primitives land in `@stackra/contracts`: `Bulkhead` (bounded concurrency with a bounded FIFO queue and
wait) and `CircuitBreaker` (closed, open, half open with trial calls). The server `createApp` admits every call through
one `Bulkhead` sized by `HttpConfig` and refuses the excess with `AppOverloadedError`, which the generated HTTP adapter
answers 503 through the new `handlers.shed`. The integrations managed client aborts each attempt at the Integration's
`timeout` and goes through the breaker and optional bulkhead the `IntegrationRuntime` keeps per Integration and origin.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/foundation/contracts`, `packages/runtime/app`, `packages/communication/integrations`, `packages/developer/gen` (all libraries); `apps/playground` and `workers/edge` (generated manifests)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), fake timers and an injected `Clock`
- **Storage**: none
- **Runtime target**: isomorphic primitives; the server bulkhead on node; the managed client isomorphic

## Key trade-off and research

- **Trade-off: per-instance state** instead of a breaker shared in a cache: no extra round trip on every provider call
  and no new failure mode when the cache is the thing that is slow. The cost: N instances let up to N × the threshold
  of failures through before all open. A bulkhead is per instance by nature.
- **Trade-off: one server compartment** for HTTP, Pub/Sub and queue calls rather than one per kind: the process has
  one event loop and one memory to protect; transports retry a shed delivery. Cron runs skip it (`run(call,
{ shed: false })`): Encore never retries a failed CronJob invocation, and a cron run is one call per job per
  schedule, so it cannot itself overload the instance.
- **Research**: ADR 0140 (`Unavailable` is 503, retryable); RFC 9110 section 10.2.3 (`Retry-After` on 503); the
  classic breaker states (Nygard, _Release It!_); the existing drain accounting in `createApp`.

## Applicable standards

| Rule                                                   | How it is enforced                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Refusals by kind (ADR 0140)                            | check: `app-overloaded.error.test.ts`; the manifest error list                  |
| A package ships its own config schema (ADR 0294 d26)   | check: `http.config.test.ts` (schema defaults equal the class)                  |
| Lengths are `Duration`s (owner D10)                    | check: `read-integration-options.function.test.ts`                              |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in CI                                              |
| Barrel exports exactly its values                      | check: `src/core/__tests__/index.test.ts`, `src/server/__tests__/index.test.ts` |
| Changesets for publishable packages                    | check: changeset status in CI                                                   |

## Constitution Check

| Law                                   | Result | Note                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | app and integrations import foundation contracts; no upward import      |
| Secrets (ADR 0009)                    | PASS   | no secret read or added; refusals carry no credential                   |
| Security                              | PASS   | the 503 echoes only an allowed CORS origin; no body or caller in errors |
| HTTP and events                       | PASS   | no route or event added; a shed delivery is retried by its transport    |
| Tenancy                               | N/A    | no tenant data; guards keyed by Integration and origin                  |
| Delegation                            | PASS   | R2: Claude, one wave                                                    |
| Not built yet (ADR 0011)              | PASS   | no rejected or deferred technology                                      |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                           |
| Versions and catalogs                 | PASS   | no dependency added                                                     |
| Deploy modes (ADR 0076)               | PASS   | in-process only                                                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                               |
| Docs and ADRs                         | PASS   | READMEs and AGENTS.md of the three runtime packages updated             |

## Deploy modes

| Mode       | Behaviour                                                       |
| ---------- | --------------------------------------------------------------- |
| SaaS       | defaults apply; a host tunes `app.http` and Integration options |
| On-prem    | same                                                            |
| Air-gapped | same; no outbound call added                                    |

## Correctness properties

- **P-001**: at any time a bulkhead holds at most `limit` places and `queue` waiters; waiters are served in arrival order — Validates: FR-002, FR-009
- **P-002**: a released place is given back once however often release is called — Validates: FR-002, FR-010
- **P-003**: the breaker opens exactly at `failureThreshold` failures in a row and admits nothing until `cooldownMs` passes — Validates: FR-007, FR-008, FR-011
- **P-004**: a trial's outcome alone closes or reopens a half-open circuit; a stale outcome changes nothing — Validates: FR-007
- **P-005**: a shed call never gets a request container and never reaches the provider — Validates: FR-002, FR-008, FR-009
- **P-006**: every attempt's timer is cleared and every place released, whatever the outcome — Validates: FR-006, FR-010
- **P-008**: an HTTP call holds its bulkhead place reading its body for at most `bodyReadTimeoutMs`, then answers 408 with no timer left — Validates: FR-014
- **P-009**: a circuit keyed `by` credential opens only on its own connection's failures; another connection's or the platform's calls still send — Validates: FR-016
- **P-007**: a call run with `{ shed: false }` (every generated cron run) never waits on or is refused by the bulkhead, however full it is, and is still counted in flight — Validates: FR-013

## Architecture overview

```mermaid
flowchart TD
  adapter["generated Encore adapter"] --> run["handlers.run"]
  run --> bh["Bulkhead (app.http)"]
  bh -- place --> call["request container + call"]
  bh -- turned away --> err["AppOverloadedError"]
  err --> shed["handlers.shed: 503 + Retry-After + CORS"]
  call --> client["managed client"]
  client --> breaker["CircuitBreaker (Integration:origin)"]
  breaker -- open --> refuse["ProviderUnavailableError circuit_open"]
  breaker -- admitted --> pbh["Bulkhead (concurrency)"]
  pbh -- full --> refuse2["ProviderUnavailableError bulkhead_full"]
  pbh -- place --> fetch["fetch, aborted at timeout"]
```

## Components and responsibilities

Three components: the primitives (C1), the server's load shedding with the generated adapters (C2), and the
integrations' per-provider resilience (C3).

### C1 `Bulkhead` and `CircuitBreaker`

**Responsibility**: the two primitives · **Location**: `packages/foundation/contracts/src/core/`

```text
packages/foundation/contracts/src/core/
├── values/bulkhead.value.ts                         (new)
├── values/circuit-breaker.value.ts                  (new)
├── enums/circuit-state.enum.ts                      (new)
├── types/bulkhead-options.type.ts                   (new)
├── types/circuit-breaker-options.type.ts            (new)
├── types/circuit-ticket.type.ts                     (new)
├── values/__tests__/bulkhead.value.test.ts          (new)
├── values/__tests__/circuit-breaker.value.test.ts   (new)
└── index.ts                                         (changed: exports)
```

```ts
export class Bulkhead {
  constructor(options: { limit: number; queue?: number; maxWaitMs?: number });
  enter(signal?: AbortSignal): Promise<(() => void) | undefined>; // an aborted signal leaves the queue
}
export class CircuitBreaker {
  constructor(options: { failureThreshold: number; cooldownMs: number; halfOpenProbes?: number });
  state(now: number): CircuitState;
  retryAfterMs(now: number): number;
  admit(now: number): CircuitTicket | undefined; // ticket: succeed() / fail(now) / release()
}
```

**Failure modes**: invalid options throw `RangeError` at construction; nothing throws while running.

### C2 Server load shedding

**Responsibility**: admit calls, refuse the excess, answer it 503 · **Location**: `packages/runtime/app`, `packages/developer/gen`

```text
packages/runtime/app/src/
├── server/functions/create-app.function.ts          (changed: Bulkhead in run, shed)
├── server/errors/app-overloaded.error.ts            (new)
├── server/constants/overload-retry-after.constant.ts (new)
├── server/types/server-handlers.type.ts             (changed: shed, run options)
├── server/types/server-run-options.type.ts          (new: shed: false for cron runs)
├── server/index.ts                                  (changed: exports)
├── server/functions/serve-guarded-call.function.ts  (changed: body read deadline, 408)
├── server/functions/read-capped-body.function.ts    (changed: abort signal)
├── server/types/guarded-call-options.type.ts        (changed: bodyReadTimeoutMs)
├── config/http.config.ts                            (docs)
├── core/schemas/http-options.schema.ts              (changed: four keys)
└── core/constants/http-config-schema.constant.ts    (changed: four keys)
packages/developer/gen/src/core/functions/emit-encore-http.function.ts (changed: .catch → shed handler, body deadline)
packages/developer/gen/src/core/functions/emit-encore-cron-jobs.function.ts (changed: run with { shed: false })
packages/developer/gen/__golden__/                    (regenerated: the HTTP and cron goldens of every fixture service)
└── <fixture>/expected/services/<member>/stackra-encore/<member>/
    ├── http.ts.golden                               (regenerated)
    └── cron.ts.golden                               (regenerated)
```

```ts
export interface ServerRunOptions {
  readonly shed?: boolean; // false: skip the bulkhead (cron runs)
}
export interface ServerHandlers {
  run: <T>(
    call: (container: Container) => T | Promise<T>,
    options?: ServerRunOptions,
  ) => Promise<T>;
  shed: (request: Request, error: unknown) => Promise<Response>;
}
export class AppOverloadedError extends Refusal({ kind: ErrorKind.Unavailable, retryable: true }) {
  static create(options: { retryAfterMs: number }): AppOverloadedError;
  retryAfterMs?: number;
}
```

**Failure modes**: a non-shed error passed to `shed` is rethrown unchanged; a cron run is never shed (Encore does not
retry a failed CronJob invocation).

### C3 Integration resilience

**Responsibility**: timeout, breaker and bulkhead per provider origin · **Location**: `packages/communication/integrations`

```text
packages/communication/integrations/src/core/
├── functions/managed-client.function.ts             (changed: attemptOnce, readBody)
├── functions/read-integration-options.function.ts   (changed: checks)
├── services/integration-runtime.service.ts          (changed: guardsOf, a circuit per connection when by credential)
├── enums/rate-limit-scope.enum.ts                   (docs: also the circuit's `by`)
├── types/integration-options.type.ts                (changed: timeout, circuitBreaker, concurrency)
├── types/managed-client-options.type.ts             (changed: guardsOf)
└── errors/provider-unavailable.error.ts             (changed: reason)
```

```ts
export interface IntegrationOptions {
  readonly timeout?: Duration; // per attempt, 30 s by default
  readonly circuitBreaker?:
    | false
    | {
        readonly failureThreshold?: number;
        readonly cooldown?: Duration;
        readonly by?: RateLimitScope; // Credential: one circuit per connection
      };
  readonly concurrency?: {
    readonly limit: number;
    readonly queue?: number;
    readonly maxWait?: Duration;
  };
}
export class ProviderUnavailableError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {
  reason?: "timeout" | "circuit_open" | "bulkhead_full";
}
```

**Failure modes**: open circuit / full bulkhead → `ProviderUnavailableError` without a request; caller abort → the
caller's reason, also while queued for the bulkhead; headers then a stalled body → a circuit failure.

## Files and folders

The trees of C1 to C3, plus:

```text
apps/playground/stackra.manifest.json                (generated: app_overloaded)
workers/edge/stackra.manifest.json                   (generated: app_overloaded)
packages/foundation/contracts/stackra.manifest.json  (generated: CircuitState)
packages/foundation/contracts/README.md              (docs)
packages/foundation/contracts/AGENTS.md              (docs)
packages/runtime/app/stackra.manifest.json           (generated: app_overloaded)
packages/runtime/app/README.md                       (docs)
packages/runtime/app/AGENTS.md                       (docs)
packages/communication/integrations/README.md        (docs)
packages/communication/integrations/AGENTS.md        (docs)
packages/developer/gen/README.md                     (docs: the cron adapter)
.changeset/load-shedding-circuit-breaker.md          (changeset)
```

## Data models and migrations

none

## Contracts

Additive exports listed in the spec's Impact. Compatibility: only optional additions (`Bulkhead#enter(signal)`,
`GuardedCallOptions.bodyReadTimeoutMs`, `circuitBreaker.by`); `ProviderUnavailableError` gains an optional field. Default behaviour changes (shedding on, 30 s attempt timeout, breaker on): minor bumps.

## Error handling

`AppOverloadedError` (`app_overloaded`, Unavailable, retryable, 503 with `Retry-After: 1`);
`ProviderUnavailableError` with `reason` `timeout` / `circuit_open` / `bulkhead_full`.

## Security and tenancy

No tenant data; the 503 echoes only an allowed origin through `corsHeaders`; refusals carry no credential or body.
A shared circuit is one tenant's failures shedding every tenant's calls to that origin for one cooldown: the default,
since a provider outage is everyone's; `circuitBreaker.by: RateLimitScope.Credential` keys it per connection id (never a
credential value). The body read deadline answers 408 before any guard, so a slow-loris client never reaches auth.

## Testing strategy

- AC-001, AC-002, AC-003: `create-app.function.test.ts` "load shedding", `http.config.test.ts`, `emit-encore-http.function.test.ts`, `app-overloaded.error.test.ts`
- AC-004, AC-005, AC-006: `managed-client.function.test.ts` and `integration-runtime.service.test.ts` "STA-1467", `read-integration-options.function.test.ts`
- P-001 to P-004: `bulkhead.value.test.ts`, `circuit-breaker.value.test.ts`
- AC-007: the barrel tests and the gen manifest check
- AC-009: `serve-guarded-call.function.test.ts` "answers 408 for a body that does not arrive within the deadline", `read-capped-body.function.test.ts`, `http.config.test.ts`, `emit-encore-http.function.test.ts` "bounds the body read"
- AC-010: `managed-client.function.test.ts` "counts an answer whose body stalls past the timeout as a failure of the circuit" and "lets a call whose caller gives up while queued for the bulkhead leave the queue", `bulkhead.value.test.ts`
- AC-011: `integration-runtime.service.test.ts` "keeps one circuit per connection for an Integration that keys it by credential", `read-integration-options.function.test.ts`
- AC-008, P-007: `create-app.function.test.ts` "runs a cron call ({ shed: false }) at once while the bulkhead and its queue are full", `emit-encore-cron-jobs.function.test.ts` "runs every CronJob outside the load-shedding bulkhead" and the `cron.ts.golden` files

## Rollout

Publish `@stackra/contracts`, `@stackra/app`, `@stackra/integrations` and `@stackra/gen` (minor) together; regenerate
consumers so their HTTP adapters call `handlers.shed`.

## Partial-failure ordering

`@stackra/contracts` before `@stackra/app` and `@stackra/integrations`; `@stackra/app` (with `shed`) with or before a
`@stackra/gen` that emits the call. One changeset bumps all four in one release.

## Delegation and risk plan

R2: Claude only, one wave, review before merge.

## ADRs

ADR 0140, ADR 0143, ADR 0294, ADR 0295, ADR 0308.

## Docs

The READMEs and AGENTS.md of `packages/foundation/contracts`, `packages/runtime/app`, `packages/communication/integrations`.

## Complexity tracking

none

## Open questions

None.
