# Feature Specification: endpoint errors answer the ADR 0140 envelope and crashes reach the ErrorReporter

**Feature Branch**: `figentra/sta-2048-typed-error-envelope`

**Created**: 2026-11-26

**Status**: Tasked

**Tier**: feature

**Approver**: leader

**Linear**: STA-2048

**Clarifications status**: complete

**Input**: An error thrown inside a generated HTTP endpoint that is not a refusal (a missing driver, a crash in a
handler, a run refused while the app drains) escapes the generated `answerHttp`. Encore then writes its own 500: no
`category`, no `retryable`, no `correlationId`, the raw error message in `internal_message`, and the crash reaches only
the trace span, never the `ErrorReporter` (Sentry). Built in stackra#1108; this spec records the contract change.

### Sources

- ADR 0140 (decisions 1 to 3: the envelope, its `correlationId`, the `internal` category and the one status table)
  — FR-001 to FR-005
- ADR 0232 (decision 8: the reporter port, report what was not handled, once) — FR-004, FR-006
- ADR 0184 (decisions 1 and 6: the edge's request id; crashes go to Sentry, scrubbed) — FR-003, FR-006
- The diff of stackra#1108 against main and its tests — FR-001 to FR-007
- The PR's reproduction on a real Encore app: before the change the endpoint answered Encore's bare `internal` 500 with
  the error text in `internal_message` — FR-002

## Impact

- **Apps touched**: none
- **Services touched**: none in core (every service's generated `stackra-encore/<member>/http.ts` changes on its next
  `stackra gen`)
- **Packages touched**: `@stackra/errors` (`packages/foundation/errors`: the `ErrorReporter` port, the new
  `ErrorReportContext` type, the memory and Sentry drivers, `sentryEnvelope`), `@stackra/app`
  (`packages/runtime/app`: `answerRefusal`, `answerFailure`, `correlationIdOf`, `ServerApp.reporter`,
  `GuardedCallOptions.correlationId`, `serveGuardedCall`, the console reporter), `@stackra/gen`
  (`packages/developer/gen`: `emitEncoreHttp` and the `http.ts` goldens)
- **Public contract change**: additive. `ErrorReporter#report(error, context?)` gains an optional second parameter
  `ErrorReportContext { correlationId? }`, exported from `@stackra/errors/contracts`; `@stackra/app/server` exports
  `answerRefusal`, `answerFailure` and `correlationIdOf`; `ServerApp` gains `readonly reporter: ErrorReporter`;
  `GuardedCallOptions` gains `correlationId?`. The generated `answerHttp` becomes `async` and its `handle` callback
  gains a third parameter `correlationId: string`. The HTTP answer of an unexpected error changes from Encore's 500 to
  `500 { code: "internal", category: "internal", retryable: false, correlationId }`
- **Cross-service events**: none
- **Tenancy and data**: none (no table, no tenant read; the correlation id is an id, never request context)
- **Security and privacy**: the 500 answer names no message, name or stack (before, Encore echoed the message in
  `internal_message`); the error goes to the reporter as it is and its driver scrubs it (ADR 0184 d6); a header-borne
  id is echoed only when it is a plain id (`[\w.:-]{1,128}`); the report context carries ids only, never input, a
  header value or a person
- **Secrets**: none (the Sentry DSN secret is unchanged)
- **ADR needed**: no (implements ADR 0140 decisions 1 to 3 and ADR 0232 decision 8 as written)
- **New dependencies**: none (`encore.dev`'s `currentRequest` is read by the generated file, which already imports
  Encore; a service no longer needs to declare `@stackra/errors` for its 429 answer)
- **Deploy modes**: same in all three (the reporter is whichever driver the wiring binds; the console reporter when
  none)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/runtime/app/README.md` and `AGENTS.md`, `packages/developer/gen/README.md` and
  `AGENTS.md`, `packages/foundation/errors/AGENTS.md`; the changeset `.changeset/sta-2048-error-answers.md`
- **Lane**: full
- **Change risk**: R2 (the error path of every generated HTTP endpoint and the reporter port; additive types, no data)

## Glossary

- **Refusal**: an error of a `Refusal` class (`isRefusal`), an expected answer with an `ErrorKind`; it is answered,
  never reported.
- **Failure**: anything else a call throws, or a refused run (the app draining); it is reported once and answered 500.
- **Correlation id**: the one id per request that the error envelope's `correlationId` and the `ErrorReporter` report
  both carry (`correlationIdOf`).

## Contract change

### What callers and consumers see

- **HTTP clients**: every error answer of a generated endpoint is an ADR 0140 envelope. A refusal answers its kind's
  status (`Enum.meta(ErrorKind, kind).httpStatus`) with `correlationId`; a guard's `RateLimitedError` answers 429 with
  `Retry-After` and `RateLimit-*`; a running idempotency key answers with `Retry-After: 1`; anything else answers
  `500 { code: "internal", category: "internal", retryable: false, correlationId }`. Encore's own 500 and its
  `internal_message` are no longer reachable from a generated endpoint.
- **`ErrorReporter` drivers** (`@stackra/errors/contracts`): `report(error, context?)`. An existing driver that
  implements `report(error)` still satisfies the port (TypeScript accepts fewer parameters) and simply drops the
  context. The Sentry driver tags the event `correlation_id`; the memory driver keeps `contexts` at the same index as
  `errors`; the console reporter prints `correlationId <id>:` before the error.
- **Callers of `report`**: unchanged; the context is optional.
- **`@stackra/app/server` consumers**: three new functions and `ServerApp.reporter` (boot's reporter, the console
  reporter when the wiring binds none). `serveGuardedCall` takes `correlationId?` and, absent, reads it from the
  request; a guard's rate limit is now answered 429 by `serveGuardedCall` itself instead of propagating.
- **Generated code**: `stackra-encore/<member>/http.ts` imports `answerFailure`, `correlationIdOf` and
  `currentRequest` (`encore.dev`) and no longer imports `@stackra/errors`; `answerHttp` is `async`, computes the
  correlation id once, wraps `app.handlers.run` and the handler in `answerFailure`, and passes the id to
  `serveGuardedCall`.

### Compatibility and migration

- Additive at the type level for every published package: a minor changeset for `@stackra/app`, `@stackra/errors` and
  `@stackra/gen`.
- A custom `ErrorReporter` driver needs no change; to keep the correlation id it adds the optional parameter.
- A service regenerates its adapter with `stackra gen`; until it does, the old adapter keeps the old behaviour (a
  non-refusal error reaches Encore's 500). No data migration.
- A hand-written caller of the generated `answerHttp` (none in core) passes a `handle` that may ignore the third
  parameter.

## Acceptance criteria

- **AC-001**: WHEN `answerRefusal` answers a refusal of any `ErrorKind` THE answer SHALL carry the status
  `Enum.meta(ErrorKind, kind).httpStatus` and the refusal's envelope with the given correlation id.
- **AC-002**: WHEN `answerRefusal` answers a rate limit or a running idempotency key THE answer SHALL carry its
  back-off headers (`rateLimitHeaders` for a `RateLimitedError`, `Retry-After: 1` for an `IdempotencyKeyInProgressError`).
- **AC-003**: WHEN `answerFailure` is handed an error that is not a refusal THE function SHALL report it once to the
  `ErrorReporter` with `{ correlationId }` and answer 500 with the `internal` envelope (`code` and `category`
  `internal`, `retryable: false`, the `correlationId`) and no message, name or stack.
- **AC-004**: IF the reporter throws or a refusal's envelope cannot be written THEN THE `answerFailure` SHALL still
  answer 500 with the `internal` envelope and never throw.
- **AC-005**: WHEN a request names an edge request id, a `traceparent` or neither THE `correlationIdOf` SHALL return the
  edge's plain request id, else the non-zero trace id, else the runtime's trace id, else a fresh `req_` id, and SHALL
  never echo a header value that is not a plain id.
- **AC-006**: WHEN `ErrorReporter#report` is called with a context THE Sentry driver SHALL tag the event
  `correlation_id` and the memory driver SHALL keep the context at the error's index.
- **AC-007**: WHEN gen writes a service's `http.ts` THE generated `answerHttp` SHALL answer every error the handler or
  the run throws through `answerFailure` with `app.reporter` and one correlation id, and hand that id to
  `serveGuardedCall`, whether or not the service declares `@stackra/errors`.
- **AC-008**: WHEN the server app boots THE `ServerApp` SHALL carry the bound `ErrorReporter`, else the console
  reporter.
- **AC-009**: WHEN a guard refuses with `RateLimitedError` THE `serveGuardedCall` SHALL answer 429 with its back-off
  headers and the call's correlation id.

## Requirements

### Functional Requirements

- **FR-001**: THE `answerRefusal(refusal, correlationId?)` function SHALL answer a refusal with its kind's status from
  the one mapping table and its envelope, plus its retry headers.
- **FR-002**: THE `answerFailure(error, { correlationId, reporter })` function SHALL answer a refusal as `answerRefusal`
  does and anything else as a reported 500 `internal` envelope, and SHALL never throw.
- **FR-003**: THE `correlationIdOf(request, traceId?)` function SHALL pick the one correlation id of a request from the
  edge's request id, the `traceparent`, the runtime's trace id or a fresh `req_` id, accepting only plain ids.
- **FR-004**: THE `ErrorReporter` port SHALL take an optional `ErrorReportContext { correlationId? }` beside the error.
- **FR-005**: THE generated `answerHttp` SHALL route every error of the handler and of the run through `answerFailure`
  with one correlation id per request, shared with `serveGuardedCall`.
- **FR-006**: THE Sentry, memory and console reporters SHALL carry the context's correlation id (tag, kept context,
  printed prefix).
- **FR-007**: THE `ServerApp` SHALL expose the reporter boot resolved, so the adapter reports where shutdown failures go.

## Edge cases

- **EC-01**: The app is draining: `app.handlers.run` refuses, no request container exists, so the 503 answer carries no
  CORS headers.
- **EC-02**: An all-zero or malformed `traceparent` is not a trace; the next source is used.
- **EC-03**: A refusal with a detail JSON cannot hold is a fault of its author: reported and answered 500.

## Risks and known gaps

- Some error answers still carry no `correlationId`: `serveGuardedCall`'s own `refused()` (401/403
  `request_refused`), `invalidBody()` (400) and the 413 `payload_too_large`. They never had one, so this is not a
  regression, but ADR 0140 decision 1 lists the field as required; a follow-up passes the id into those builders.
- `answerHttp` computes the correlation id before the edge guard has checked the signed request id header, so a crash
  before or inside the guards (or on a deployment without the edge) is answered and reported with a caller-chosen id.
  `PLAIN_ID` blocks injection, but an id can be spoofed or collide; a follow-up takes the edge id only after the guards
  pass.
- A service that is not regenerated keeps the old adapter until its next `stackra gen`.

## Out of scope

- Mapping errors to Encore's `APIError` for typed (non-raw) endpoints (ADR 0140 decision 4).
- The two follow-ups in Risks and known gaps.

## Open questions

None.

## Status history

- 2026-11-26 → Draft (from the PR's diff and tests; built in stackra#1108)
- 2026-11-26 → Clarified (no open question: the design is ADR 0140 decisions 1 to 3 and ADR 0232 decision 8)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; every task built in stackra#1108)
