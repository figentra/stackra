# AGENTS — @stackra/transport

The HTTP client pipeline. Member at `packages/foundation/transport` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305). Entries `.` and `./native`.

## Where code goes

| You are writing…                | It goes in…                                 |
| ------------------------------- | ------------------------------------------- |
| A middleware or a stream reader | `src/core/functions/<name>.function.ts`     |
| A type                          | `src/core/types/<name>.type.ts`             |
| A constant                      | `src/core/constants/<name>.constant.ts`     |
| A refusal                       | `src/core/errors/<name>.error.ts`           |
| Expo-only code                  | `src/native/<name>/`                        |
| A test                          | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,native}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public
  file to its barrel and to that entry's `index.test.ts`.
- `nativeFetch` is exported from `./native` only; `./native` imports `.` through the `#core` alias.

## This package

- The pipeline speaks the platform's `Request` and `Response`; never add a wrapper type.
- A middleware never mutates the request it is given: header middleware go through `withHeader`.
- `retry` repeats only what is safe to repeat (idempotent method or `Idempotency-Key`). Never loosen that.
- Retryable statuses come from `ErrorKind` (`RETRYABLE_STATUSES`); never write a status list by hand (ADR 0140).
- `TransportError` and `RetryOn` belong to `@stackra/clients`; do not declare them here.
- Use `AbortController` and `setTimeout`, not `AbortSignal.timeout` or `AbortSignal.any` (Hermes lacks them).
- No parameter properties, no `#private` fields, no decorators in its own source: it keeps to erasable syntax, though its
  `decorators-react` preset turns the check off so tsc can read the decorated sources of @stackra/config and
  @stackra/errors.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                        | Where              | Handling                                                                                  |
| --------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| Bearer token                | `bearerToken`      | Asked per request from the caller's source; never stored or logged.                       |
| Request and response bodies | the whole pipeline | Passed through; never stored or logged. `RequestTimedOutError` carries only the duration. |
