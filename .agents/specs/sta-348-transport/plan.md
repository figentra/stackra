# Plan: `@stackra/transport` wave 2

**Spec**: `.agents/specs/sta-348-transport/spec.md`

## Design

- The pipeline speaks the platform's `Request` and `Response`. `Transport = (request) => Promise<Response>`;
  `Middleware = (request, next) => Promise<Response>`. `createTransport` folds the middleware right to left over the
  terminal fetch (the global `fetch`, read at send time, or `options.fetch`).
- A header middleware never mutates the caller's request: `withHeader` copies it with `new Request(request, {
headers })`, and only when the header is absent.
- `retry` decides "safe to repeat" by method or by a present `Idempotency-Key`, clones the request for every attempt but
  the last, retries a fetch `TypeError` or `RequestTimedOutError`, and a status whose `ErrorKind` is retryable (read
  from `Enum.meta`). It honours `Retry-After` up to `maxWait` and reads the envelope's `retryable: false`. Waits end
  early when the caller aborts, and the next attempt then fails with the platform's abort error.
- `timeout` links a fresh `AbortController` to the caller's signal, aborts after the duration, clears the timer once
  headers arrive (so a stream is not cut), and turns its own abort into `RequestTimedOutError`.
- `readLines` (internal) decodes the body with a streaming `TextDecoder`, splits on `\r\n`, `\n` and `\r` across chunk
  boundaries, falls back to `response.text()` when there is no body stream, and cancels the stream when the consumer
  stops early. `readNdjson` and `readServerSentEvents` build on it.
- `./native`: `nativeFetch` turns the `Request` into `expo/fetch`'s `(url, init)` call; its response is structurally a
  `Response` with a streaming body.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/transport`; workspace imports: `@stackra/contracts`, `@stackra/errors` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                        |
| Security                              | PASS   | `bearerToken` and `idempotencyKey` are middleware the consumer adds; the package stores no token                                                           |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                               |
| Tenancy                               | N/A    | no tenant data                                                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                     |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                          |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                            |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                    |

- Boundaries: imports `@stackra/contracts` and `@stackra/errors` only; `./native` imports `.` types and `expo/fetch`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; the refusal ends in `Error`; constants SCREAMING_SNAKE.
- No parameter properties, no `#private` fields, no decorators (`library` preset, `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| SaaS       | a build-time library, bundled into the consumer's app or service                                       |
| On-prem    | identical: the same build, no SaaS-only code path                                                      |
| Air-gapped | identical: the package itself makes no call; every request is the consumer's, to the consumer's origin |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./native` — Validates: FR-001
- **P-002**: `.` exports `createTransport`, `bearerToken`, `idempotencyKey`, `stackraVersion`, `retry`, `timeout`, `readNdjson`, `readServerSentEvents`, `RequestTimedOutError`, `TRANSPORT_HEADERS` and the types `Middleware`, `Transport`, `TransportOptions`, `RetryOptions`, `ServerSentEvent` and `TokenSource` — Validates: FR-002
- **P-003**: `./native` exports `nativeFetch` and nothing else — Validates: FR-003
- **P-004**: `retry` treats a status as retryable exactly when `ErrorKind`'s metadata marks it so, with no hand-written status list — Validates: FR-004
- **P-005**: `package.json` `dependencies` lists `@stackra/contracts` and `@stackra/errors` only, and `expo` is an optional peer — Validates: FR-005
