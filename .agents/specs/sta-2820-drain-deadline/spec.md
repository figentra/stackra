# Feature Specification: the server shutdown drain stops waiting at a deadline

**Feature Branch**: `figentra/sta-2820-drain-deadline`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2820

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: When a server member of `@stackra/app` stops, `drain()` waits for every call still in flight with no time
limit. One call that never settles keeps the stopping process alive until the platform sends SIGKILL, and because the
drain never ends, `close()` never runs, so the shutdown hooks (the outbox flush among them) are skipped. ADR 0143
decision 3 (CT3) asks for draining timeouts.

### Sources

- `packages/runtime/app/src/server/functions/create-app.function.ts` (the unbounded `drain()` before this change)
- `packages/runtime/app/src/server/types/server-app.type.ts` (the `ServerApp.drain` and `close` contract)
- `packages/runtime/app/src/core/schemas/http-options.schema.ts` and
  `packages/runtime/app/src/core/constants/http-config-schema.constant.ts` (the `app.http` configuration)
- ADR 0143 decision 3 (lifecycle, CT3: "the shutdown hooks in reverse order and draining timeouts"), ADR 0295
  decision 8 (`drain()`), ADR 0232 decision 8 (report an unexpected error once), ADR 0294 decisions 19 and 26
- FR-001 to FR-005: the PR's diff against `main` and its tests (`create-app.function.test.ts`,
  `drain-timeout.error.test.ts`, `http.config.test.ts`, `index.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/runtime/app (`HttpOptions`, `HTTP_CONFIG_SCHEMA`, `HttpConfig`, the server
  `createApp`, `ServerApp`, the `./server` barrel, a new `DrainTimeoutError`)
- **Public contract change**: additive. A new `app.http` setting `drainTimeoutSeconds` (integer, 1 to 600, default 20)
  on `HttpOptions` / `HttpConfig` and its shipped schema `HttpConfig$`; a new export `DrainTimeoutError` from
  `@stackra/app/server`; `ServerApp.drain()` keeps its signature (`() => Promise<void>`) but now also resolves at the
  deadline. No existing member, key or export is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none. The reported error carries a count and the deadline only, never a call's input, caller,
  tenant or result.
- **Security and privacy**: no personal data in the report; the deadline cannot be set from a request (configuration
  only, bounded 1 to 600).
- **Secrets**: none
- **ADR needed**: no (implements ADR 0143 decision 3, "draining timeouts", as written)
- **New dependencies**: none (`@stackra/config`'s `buildConfig` is already a dependency of the package)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/runtime/app/README.md`, `packages/runtime/app/AGENTS.md`, a minor changeset for
  `@stackra/app`
- **Lane**: full (new behaviour and a new public setting and export in a runtime package)
- **Change risk**: R1 (shutdown behaviour of every server member changes only when a call outlives the deadline)

## Glossary _(full lane)_

- **Drain**: `ServerApp.drain()`: refuse new calls, then wait for the calls in flight to settle.
- **Call in flight**: a call `handlers.run` started before the drain began and that has not settled.
- **Drain deadline**: `HttpConfig.drainTimeoutSeconds`, read once after boot; its default when the wiring binds no
  `HttpConfig`.
- **Grace period**: the time a platform allows between SIGTERM and SIGKILL (about 30 s on Kubernetes and ECS / Fargate,
  10 s on Cloud Run).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A hung call does not stop the shutdown hooks (Priority: P1)

An operator rolls a deployment. One call in a member never settles. The member still stops refusing work, runs its
shutdown hooks (the outbox flush among them) and exits 0 before the platform's SIGKILL, and the error tracker shows one
report naming how many calls were abandoned.

**Why this priority**: today the hung call holds the process until SIGKILL and the outbox flush never runs.

**Independent Test**: boot `createApp` with a memory `ErrorReporter`, start calls that never settle, drain under fake
timers, and read what was reported and whether `close()` ran the container shutdown.

**Acceptance Scenarios**:

1. **Given** two calls that never settle and the default configuration, **When** `drain()` runs, **Then** it is still
   pending at 19.999 s with nothing reported, and at 20 s it resolves and one `DrainTimeoutError` with `pending: 2` and
   `timeoutSeconds: 20` is reported.
2. **Given** a hung call, **When** the process receives SIGTERM, **Then** after the deadline the container shuts down
   (each `onApplicationShutdown` runs) and the process exits 0.

---

### User Story 2 - A host sets its own deadline (Priority: P2)

A host on a platform with a shorter grace period overrides `drainTimeoutSeconds` in its `app.http` configuration.

**Why this priority**: 20 s fits a 30 s grace period; a host with a shorter one needs a lower deadline.

**Independent Test**: the same run with a host `HttpConfig` override of 2 s.

**Acceptance Scenarios**:

1. **Given** `class HttpConfig extends BaseHttpConfig { override drainTimeoutSeconds = 2 }`, **When** `drain()` runs
   with one hung call, **Then** it resolves at 2 s and reports `pending: 1, timeoutSeconds: 2`.

---

### User Story 3 - A clean drain stays silent (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a slow call that settles before the deadline, **When** `drain()` runs, **Then** nothing is reported and
   no timer is left behind once the drain resolves.

---

### Edge Cases

- **EC-01**: A drain with no call in flight resolves at once and arms no timer.
- **EC-02**: `drain()` is idempotent: a second call returns the same promise, so the deadline is armed once.
- **EC-03**: Calls cannot be added during the drain (`run` refuses with `AppDrainingError` once draining is set), so the
  count reported at the deadline is final for that drain.
- **EC-04**: The abandoned calls are not cancelled; they keep running until the process exits, and anything they write
  after the hooks ran is lost, as it already was at SIGKILL.
- **EC-05**: A failed call does not block the drain (unchanged behaviour, still tested).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `HttpOptions` shape and its shipped schema `HttpConfig$` SHALL carry `drainTimeoutSeconds`, an
  integer from 1 to 600 with default 20, and the schema default SHALL equal the shape's initializer.
- **FR-002**: WHEN `drain()` runs with calls in flight THE server `createApp` SHALL wait for them for at most
  `drainTimeoutSeconds`, read once after boot from the bound `HttpConfig`, or from its defaults when none is bound.
- **FR-003**: IF the deadline passes with calls still in flight THEN THE server `createApp` SHALL report exactly one
  `DrainTimeoutError` carrying the count still running and the deadline through the `ErrorReporter`, and resolve the
  drain, so `close()` and the SIGTERM path run the shutdown hooks and exit.
- **FR-004**: WHEN the calls in flight settle before the deadline THE server `createApp` SHALL report nothing and clear
  the deadline timer.
- **FR-005**: THE `@stackra/app/server` entry SHALL export `DrainTimeoutError`, a plain `Error` (not a refusal) whose
  message and fields carry only the count and the deadline.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN calls in flight outlive the drain deadline THE server `createApp` SHALL resolve `drain()` at the
  deadline and report one `DrainTimeoutError` with the count still running.
- **AC-002**: WHEN the process receives SIGTERM while a call hangs THE server app SHALL run the container shutdown after
  the deadline and exit 0.
- **AC-003**: WHERE a host overrides `app.http.drainTimeoutSeconds` THE server `createApp` SHALL use that deadline.
- **AC-004**: WHEN the calls settle before the deadline THE server `createApp` SHALL report nothing and leave no timer.
- **AC-005**: THE `app.http` configuration SHALL default `drainTimeoutSeconds` to 20 and refuse a value outside 1 to 600.

## Success Criteria _(mandatory)_

- **SC-001**: `create-app.function.test.ts` ("drain deadline") proves AC-001 to AC-004 under fake timers, and fails
  when the deadline is reverted — verified by: unit
- **SC-002**: `drain-timeout.error.test.ts`, `http.config.test.ts` and `index.test.ts` prove FR-001 and FR-005 —
  verified by: unit
- **SC-003**: the `@stackra/app` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Existing hosts need no change: the setting has a default, and `drain()` keeps its signature.
- Behaviour change: a member whose calls outlive 20 s now shuts down without them instead of hanging until SIGKILL. A
  host that relied on waiting longer raises `drainTimeoutSeconds` (up to 600), keeping deadline plus shutdown hooks
  inside its platform's grace period.
- A host on Cloud Run (10 s grace) should lower the deadline, for example to 5.

## Risks

- **R-1**: The 20 s default assumes about 30 s of grace (Kubernetes, ECS / Fargate). On a shorter grace the deadline
  plus the hooks may not fit; mitigated by the setting and the docs note above.
- **R-2**: `close()` still awaits `container.close()` with no limit, so a hanging shutdown hook can still hold the
  process until SIGKILL. Out of scope here; a follow-up bounds it the same way.
- **R-3**: Abandoned calls may leave partial work; this is no worse than SIGKILL, and the outbox flush now runs.

## Out of scope

- A deadline on `close()` / the shutdown hooks (R-2).
- Cancelling the abandoned calls.
- A per-platform default.

## Assumptions

- The `ErrorReporter` bound in the container reports synchronously enough to be flushed by the shutdown hooks that
  follow.
- Seconds are a fine enough unit for a drain deadline.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2820 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2820 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2820 session) · plan.md
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 · Planned → Tasked · Claude (STA-2820 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2820 session) · T002 to T008 committed on the branch
