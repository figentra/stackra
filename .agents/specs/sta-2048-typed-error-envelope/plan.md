# Implementation Plan: endpoint errors answer the ADR 0140 envelope and crashes reach the ErrorReporter

**Spec**: `.agents/specs/sta-2048-typed-error-envelope/spec.md` · **Linear**: STA-2048 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2048-typed-error-envelope/spec.md`

## Summary

`@stackra/app/server` gains the three error answers every generated adapter writes: `answerRefusal` (a refusal's
status from the one table, its envelope and retry headers), `answerFailure` (a refusal as above, anything else reported
once and answered 500 `internal`) and `correlationIdOf` (one id per request). `ServerApp` carries boot's `reporter`.
`@stackra/errors`' `ErrorReporter#report` takes an optional `ErrorReportContext { correlationId? }`, which the Sentry,
memory and console reporters carry. gen's `emitEncoreHttp` writes an `answerHttp` that sends every error of the handler
and of the run through `answerFailure` and hands the id to `serveGuardedCall`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/foundation/errors`, `packages/runtime/app`, `packages/developer/gen`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen goldens (`__golden__/`)
- **Storage**: none
- **Runtime target**: the server runtime of every service's generated Encore HTTP adapter

## Constitution Check

| Law                                   | Result | Note                                                                                 |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | app (runtime) imports errors (foundation); errors imports nothing new                |
| Secrets (ADR 0009)                    | N/A    | no secret read or named; the Sentry DSN secret is unchanged                          |
| Security                              | PASS   | the 500 names no message or stack; only plain ids are echoed; reports scrubbed       |
| HTTP and events                       | PASS   | every error answer is the ADR 0140 envelope with the table's status; no event change |
| Tenancy                               | N/A    | no tenant read or table                                                              |
| Delegation                            | PASS   | one agent, one branch                                                                |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated; no hand-written Encore in a service                          |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `__tests__/`                                          |
| Versions and catalogs                 | PASS   | minor changeset for app, errors and gen; no dependency or lockfile change            |
| Deploy modes (ADR 0076)               | PASS   | same in all three; the bound reporter or the console one                             |
| Licence tier (ADR 0077)               | PASS   | free packages                                                                        |
| Docs and ADRs                         | PASS   | READMEs and AGENTS.md of the three packages; implements ADR 0140 d1-3, ADR 0232 d8   |

## Deploy modes

| Mode       | Behaviour                                                                         |
| ---------- | --------------------------------------------------------------------------------- |
| SaaS       | crashes reach Sentry tagged `correlation_id`; clients get the `internal` envelope |
| On-prem    | the bound reporter, else the console reporter prints the id before the error      |
| Air-gapped | the console or memory reporter; no outbound call; the same envelopes              |

## Correctness properties

- **P-001**: `answerRefusal` answers each kind with its table status and envelope — Validates: FR-001, AC-001, AC-002
- **P-002**: `answerFailure` reports a non-refusal once and answers 500 `internal` — Validates: FR-002, AC-003, AC-004
- **P-003**: `correlationIdOf` returns only a plain id, from the first source that has one — Validates: FR-003, AC-005
- **P-004**: a report's context reaches every reporter driver unchanged — Validates: FR-004, FR-006, AC-006
- **P-005**: no error of a generated `answerHttp` reaches Encore; one id per call — Validates: FR-005, AC-007, AC-009
- **P-006**: `ServerApp.reporter` is the bound `ErrorReporter`, else the console one — Validates: FR-007, AC-008

Detail: P-001 holds for every `ErrorKind` (status from `Enum.meta(ErrorKind, kind).httpStatus`, the refusal's envelope
with the given correlation id). P-002 holds even when the reporter throws. P-003 never returns a header value outside
`[\w.:-]{1,128}`. P-004 covers Sentry's `correlation_id` tag, the memory driver's `contexts` and the console prefix.
P-005 means the handler and `serveGuardedCall` see the same id.

## Architecture overview

A raw Encore endpoint calls `answerCall`, which builds a `Request` and calls `answerHttp`. `answerHttp` computes
`correlationIdOf(request, currentRequest()?.trace?.traceId)` once, then runs the call in `app.handlers.run`. Inside,
the handler (`serveGuardedCall`) answers refusals itself with `answerRefusal` and that id; whatever it throws is answered
by `answerFailure(error, { correlationId, reporter: app.reporter })`. A refused run (draining) or a failure around the
call is caught outside the run and answered the same way, without CORS headers.

## Components and responsibilities

- `answerRefusal(refusal, correlationId?)`: pure; status from the one table, `refusal.toEnvelope({ correlationId })`,
  `rateLimitHeaders` on `RateLimitedError`, `Retry-After: 1` on `IdempotencyKeyInProgressError`.
- `answerFailure(error, { correlationId, reporter })`: a refusal through `answerRefusal`; otherwise (or when the
  envelope cannot be written) `reporter.report(error, { correlationId })` in a `try`, then the `internal` row of the
  table as `500` JSON.
- `correlationIdOf(request, traceId?)`: `EdgeHeader.RequestId`, then the `traceparent` trace id (not all-zero), then
  `traceId`, then `mintPublicId("req")`; header values only when plain.
- `ErrorReporter#report(error, context?)` and `ErrorReportContext`: the port and its optional context type.
- Sentry driver and `sentryEnvelope`: a `correlation_id` tag beside `code`. Memory driver: `contexts`. Console
  reporter: the id prefix.
- `ServerApp.reporter` (`createApp`), `GuardedCallOptions.correlationId`, `serveGuardedCall` (refusals and a guard's
  rate limit through `answerRefusal`).
- `emitEncoreHttp`: the generated `answerHttp` and `answerCall` above, the same text with or without
  `@stackra/errors`.

## Files and folders

```text
packages/foundation/errors/
  src/contracts/index.ts
  src/contracts/ports/error-reporter.port.ts
  src/contracts/types/error-report-context.type.ts
  src/core/drivers/memory-error-reporter.driver.ts
  src/core/drivers/sentry-error-reporter.driver.ts
  src/core/functions/sentry-envelope.function.ts
  src/core/drivers/__tests__/{memory,sentry}-error-reporter.driver.test.ts
  src/core/functions/__tests__/sentry-envelope.function.test.ts
  AGENTS.md
packages/runtime/app/
  src/server/functions/{answer-refusal,answer-failure,correlation-id-of}.function.ts
  src/server/functions/{create-app,serve-guarded-call}.function.ts
  src/server/types/{server-app,guarded-call-options}.type.ts
  src/server/index.ts
  src/core/drivers/console-error-reporter.driver.ts
  src/server/functions/__tests__/*.function.test.ts
  src/server/__tests__/index.test.ts
  README.md
  AGENTS.md
packages/developer/gen/
  src/core/functions/emit-encore-http.function.ts
  src/core/functions/__tests__/emit-encore-http.function.test.ts
  __golden__/*/expected/services/*/stackra-encore/*/http.ts.golden
  README.md
  AGENTS.md
.changeset/sta-2048-error-answers.md
```

## Data models and migrations

none

## Contracts

- `@stackra/errors/contracts`: `ErrorReporter#report(error: unknown, context?: ErrorReportContext): void`; new
  `ErrorReportContext { readonly correlationId?: string }`.
- `@stackra/app/server`: new `answerRefusal(refusal: Refusal, correlationId?: string): Response`,
  `answerFailure(error: unknown, options: { correlationId: string; reporter: ErrorReporter }): Response`,
  `correlationIdOf(request: Request, traceId?: string): string`; `ServerApp.reporter: ErrorReporter`;
  `GuardedCallOptions.correlationId?: string`.
- Generated `http.ts`: `answerHttp(request, handle: (request, container, correlationId) => Promise<Response>)` is
  `async`.
- HTTP: the unexpected-error answer is `500 { code: "internal", category: "internal", retryable: false, correlationId }`.
- Compatibility: all additive; an existing reporter driver still satisfies the port; services pick the new adapter up
  on `stackra gen`.

## Error handling

This change is the error handling. A refusal is answered, never reported. Anything else is reported once and answered
500 `internal`. A reporter that throws is swallowed so the client still gets its answer. A refusal whose envelope
cannot be serialised is treated as a fault (reported, 500). A refused run (draining) is answered 503 from its refusal
without CORS headers.

## Security and tenancy

No message, error name or stack leaves in an answer (before, Encore echoed the message in `internal_message`). Header
ids are echoed only when they match `[\w.:-]{1,128}`, so nothing a caller sends is copied into a body or a report as it
came. The report context carries ids only (ADR 0184 d6); the Sentry driver scrubs the error. Known gap: the id is taken
before the edge guard verifies the signed request id, so it can be caller-chosen on a crash before the guards pass
(spec, Risks and known gaps). No tenancy change.

## Testing strategy

- AC-001, AC-002: `answer-refusal.function.test.ts` (every `ErrorKind`; no id; back-off headers).
- AC-003, AC-004: `answer-failure.function.test.ts` (a refusal unreported; a crash reported once with the id and the
  `internal` envelope; an unserialisable refusal; a throwing reporter).
- AC-005: `correlation-id-of.function.test.ts` (edge id first; `traceparent` then runtime trace id; minted `req_`; no
  echo of a non-plain id; all-zero or malformed `traceparent`).
- AC-006: `sentry-error-reporter.driver.test.ts`, `sentry-envelope.function.test.ts`,
  `memory-error-reporter.driver.test.ts`.
- AC-007: `emit-encore-http.function.test.ts` (every error through `answerFailure` with the correlation id; the same
  output with or without `@stackra/errors`) and the regenerated `http.ts` goldens.
- AC-008: `create-app.function.test.ts` (the bound reporter, else the console reporter); `src/server/__tests__/index.test.ts`
  (the new exports).
- AC-009: `serve-guarded-call.function.test.ts` (a refusal with its status, envelope and the edge's request id; a
  guard's rate limit as 429).
- The PR reports each new test fails with the change reverted, and a before/after run on a real Encore app.

## Rollout

A minor changeset for `@stackra/app`, `@stackra/errors` and `@stackra/gen`. Services regenerate `stackra-encore/*/http.ts`
with `stackra gen` on their next update; no data migration and no flag.

## Delegation and risk plan

One agent, one branch, route `spec-task`. R2: the error path of every generated endpoint; covered by the unit tests,
the goldens and the PR's independent review. The two review notes are follow-ups (spec, Risks and known gaps).

## ADRs

ADR 0140 (decisions 1 to 3), ADR 0232 (decision 8), ADR 0184 (decisions 1 and 6); all Accepted. No draft opened.

## Docs

`packages/runtime/app/README.md`, `packages/developer/gen/README.md`, and the `AGENTS.md` of errors, app and gen.

## Complexity tracking

none
