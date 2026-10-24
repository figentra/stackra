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

## Constitution check

- Boundaries: imports `@stackra/contracts` and `@stackra/errors` only; `./native` imports `.` types and `expo/fetch`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; the refusal ends in `Error`; constants SCREAMING_SNAKE.
- No parameter properties, no `#private` fields, no decorators (`library` preset, `erasableSyntaxOnly`).
