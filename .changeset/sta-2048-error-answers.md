---
"@stackra/app": minor
"@stackra/errors": minor
"@stackra/gen": minor
---

Every error a generated HTTP endpoint meets is answered with the ADR 0140 envelope, and an unexpected one reaches the
`ErrorReporter` (STA-2048). Before, a non-refusal error (a missing driver, a crash in a handler, a refused run while
draining) escaped the adapter, so Encore wrote its own 500 with no category, no retry flag and no correlation id, put
the error's message in `internal_message`, and the crash reached only the trace span, never Sentry.

- `@stackra/app/server` adds `answerRefusal` (a refusal's kind status from `Enum.meta(ErrorKind, kind).httpStatus`,
  its envelope, `rateLimitHeaders` on a 429, `Retry-After: 1` on a running idempotency key), `answerFailure` (a
  refusal as above; anything else reported once and answered `500 { code: "internal", category: "internal",
retryable: false, correlationId }`) and `correlationIdOf` (the edge's request id, the `traceparent` trace id, the
  runtime's trace id, else a fresh `req_` id). `ServerApp` carries `reporter`. `serveGuardedCall` puts the
  correlation id on a refused call's envelope and answers a guard's rate limit as 429 itself.
- `@stackra/errors`: `ErrorReporter#report(error, context?)` takes an optional `ErrorReportContext`
  (`{ correlationId }`); the Sentry driver sends it as the `correlation_id` tag, the memory driver keeps it in
  `contexts`.
- `@stackra/gen`: the generated `answerHttp` answers every error through `answerFailure` with `app.reporter` and one
  correlation id per request (over Encore's trace id), and hands that id to `serveGuardedCall`. A service no longer
  needs to declare `@stackra/errors` for its 429 answer. Run `stackra gen` to regenerate `stackra-encore/*/http.ts`.
