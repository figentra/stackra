# Implementation Plan: the server shutdown drain stops waiting at a deadline

**Spec**: `.agents/specs/sta-2820-drain-deadline/spec.md` · **Linear**: STA-2820 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2820-drain-deadline/spec.md`

## Summary

`HttpOptions` gains `drainTimeoutSeconds` (1 to 600, default 20), mirrored in the shipped `HttpConfig$` schema. The
server `createApp` reads it once after boot (the bound `HttpConfig`, else `buildConfig(HttpConfig)`). `drain()` races
the calls in flight against a timer; at the deadline it reports one `DrainTimeoutError(pending, timeoutSeconds)`
through the `ErrorReporter` and resolves, and it always clears the timer. `DrainTimeoutError` is exported from
`@stackra/app/server`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/runtime/app` (`@stackra/app`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), fake `setTimeout` / `clearTimeout`
- **Storage**: none
- **Runtime target**: node (the server entry); the configuration shape is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                 |
| ------------------------------------- | ------ | -------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | only `@stackra/app` changes; it already depends on `@stackra/config` |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                           |
| Security                              | PASS   | the report carries a count and a deadline, no call data              |
| HTTP and events                       | N/A    | no route, header or event changes                                    |
| Tenancy                               | N/A    | no tenant data                                                       |
| Delegation                            | PASS   | one session, one branch                                              |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                               |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                   |
| Versions and catalogs                 | PASS   | no dependency added                                                  |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                    |
| Licence tier (ADR 0077)               | PASS   | free                                                                 |
| Docs and ADRs                         | PASS   | README, AGENTS.md and a changeset; implements ADR 0143 decision 3    |

## Deploy modes

| Mode       | Behaviour                                                            |
| ---------- | -------------------------------------------------------------------- |
| SaaS       | the drain stops at the deadline (20 s unless the host overrides it)  |
| On-prem    | same; the operator sets the deadline to fit the orchestrator's grace |
| Air-gapped | same                                                                 |

## Correctness properties

- **P-001**: for every value `v`, the `app.http` schema accepts `v` as `drainTimeoutSeconds` only when `v` is an integer in 1 to 600, and `.parse({})` gives 20 — Validates: FR-001
- **P-002**: for every drain with calls in flight, `drain()` resolves no later than `drainTimeoutSeconds` after it starts — Validates: FR-002
- **P-003**: a drain that hits the deadline reports exactly one `DrainTimeoutError` whose `pending` is the count still in flight — Validates: FR-003
- **P-004**: a drain whose calls settle first reports nothing and leaves zero timers — Validates: FR-004
- **P-005**: `DrainTimeoutError` is exported from `@stackra/app/server`, is not a refusal, and its message names only the count and the deadline — Validates: FR-005

## Architecture overview

The server `createApp` already tracks calls in flight in a set and refuses new calls once `draining` is set. The drain
now wraps its wait in a `Promise.race` between `Promise.all(inFlight)` and a deadline promise resolving with a private
symbol. The `finally` clears the timer on every path. `close()` and the SIGTERM handler are unchanged: they await
`drain()`, which now always resolves, then run the container shutdown.

## Components and responsibilities

- `HttpOptions` (`src/core/schemas/http-options.schema.ts`): the `drainTimeoutSeconds` field with an `@Int` bound of 1 to 600 and initializer 20.
- `HTTP_CONFIG_SCHEMA` (`src/core/constants/http-config-schema.constant.ts`): the zod field with the same bounds and
  default.
- `HttpConfig` (`src/config/http.config.ts`): unchanged class; its doc example shows the override.
- `createApp` (`src/server/functions/create-app.function.ts`): reads the deadline once after boot and bounds `drain()`.
- `DrainTimeoutError` (`src/server/errors/drain-timeout.error.ts`): `pending`, `timeoutSeconds`, a count-only message.
- `ServerApp` (`src/server/types/server-app.type.ts`): the `drain` doc names the deadline.
- `./server` barrel (`src/server/index.ts`): exports `DrainTimeoutError`.

## Files and folders

```text
packages/runtime/app/
├── AGENTS.md
├── README.md
├── package.json
└── src/
    ├── config/
    │   ├── http.config.ts
    │   └── __tests__/http.config.test.ts
    ├── core/
    │   ├── constants/http-config-schema.constant.ts
    │   └── schemas/http-options.schema.ts
    └── server/
        ├── index.ts
        ├── __tests__/index.test.ts
        ├── errors/
        │   ├── drain-timeout.error.ts
        │   └── __tests__/drain-timeout.error.test.ts
        ├── functions/
        │   ├── create-app.function.ts
        │   └── __tests__/create-app.function.test.ts
        └── types/server-app.type.ts
.changeset/
└── server-drain-deadline.md
```

- `packages/runtime/app/src/core/schemas/http-options.schema.ts`
- `packages/runtime/app/src/core/constants/http-config-schema.constant.ts`
- `packages/runtime/app/src/config/http.config.ts`
- `packages/runtime/app/src/server/functions/create-app.function.ts`
- `packages/runtime/app/src/server/errors/drain-timeout.error.ts`
- `packages/runtime/app/src/server/types/server-app.type.ts`
- `packages/runtime/app/src/server/index.ts`
- `packages/runtime/app/src/config/__tests__/http.config.test.ts`
- `packages/runtime/app/src/server/functions/__tests__/create-app.function.test.ts`
- `packages/runtime/app/src/server/errors/__tests__/drain-timeout.error.test.ts`
- `packages/runtime/app/src/server/__tests__/index.test.ts`
- `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, `.changeset/server-drain-deadline.md`

## Data models and migrations

none

## Contracts

- `HttpOptions.drainTimeoutSeconds: number` (new, additive; key `app.http.drainTimeoutSeconds`).
- `HttpConfig$` (`HTTP_CONFIG_SCHEMA`) gains the same field with default 20.
- `DrainTimeoutError` (new export of `@stackra/app/server`): `constructor(pending: number, timeoutSeconds: number)`,
  `readonly pending`, `readonly timeoutSeconds`, `name = "DrainTimeoutError"`.
- `ServerApp.drain: () => Promise<void>`: signature unchanged; it now also resolves at the deadline.
- Callers: every server member booted through `createApp` (generated Encore entries) gets the deadline with no code
  change; a host overrides it in its own `HttpConfig` subclass.

## Error handling

At the deadline the drain reports one `DrainTimeoutError` through the `ErrorReporter` (ADR 0232 decision 8) and does
not throw, so `close()` continues. A call refused during the drain still gets `AppDrainingError`, unchanged.

## Security and tenancy

The report carries the number of abandoned calls and the deadline, never a call's input, caller, tenant or result. The
deadline comes only from configuration, bounded 1 to 600, so a request cannot stretch a shutdown.

## Testing strategy

- AC-001: "stops waiting at 20 s by default, reports the calls still running and resolves" in
  `create-app.function.test.ts` (two hung calls; pending at 19.999 s, resolved at 20 s; one error with `pending: 2`).
- AC-002: "shuts the container down and exits 0 on SIGTERM when a call hangs" (container shutdown ran, exit 0).
- AC-003: "takes the deadline from a host's HttpConfig" (a 2 s override).
- AC-004: "reports nothing and leaves no timer when the calls settle in time" (timer count 1 while waiting, 0 after).
- AC-005: `http.config.test.ts` ("bounds the drain at 20 seconds by default", "takes a host's drain deadline", schema
  default equals the initializer); `drain-timeout.error.test.ts` for the error's fields and message; `index.test.ts`
  for the export.
- The deadline tests fail when the deadline is reverted.

## Rollout

A minor changeset for `@stackra/app`. Every server member gets the 20 s deadline on its next release. Hosts on a
shorter grace period lower it in their `app.http` configuration; the README says the deadline plus the hooks must fit
the platform's grace period.

## Delegation and risk plan

One session, one branch. Budget: small (one PR). Follow-up (spec R-2): bound `close()` the same way.

## ADRs

ADR 0143 decision 3 (draining timeouts), ADR 0295 decision 8 (`drain()`), ADR 0232 decision 8 (report once), ADR 0294
decisions 19 and 26 (configuration shape and shipped schema): all Accepted.

## Docs

`packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, `.changeset/server-drain-deadline.md`.

## Complexity tracking

none
