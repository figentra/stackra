# AGENTS — @stackra/logger

The driver behind the `Logger` port, its reporter and two configurations. Member at `packages/foundation/logger`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.` and `./contracts`.

## Where code goes

| You are writing…                   | It goes in…                                 |
| ---------------------------------- | ------------------------------------------- |
| A configuration                    | `src/config/<name>.config.ts`               |
| A driver                           | `src/core/drivers/<name>.driver.ts`         |
| A port, its enum and types         | `src/contracts/{ports,enums,types}/`        |
| A function, enum, constant, schema | `src/core/{functions,constants,schemas}/`   |
| A test                             | `__tests__/<name>.<kind>.test.ts` beside it |

## This package

- Code logs through the `Logger` port of `@stackra/contracts`; nothing outside the container imports this package's
  driver directly.
- Every record passes `redact` before any reporter sees it. A new reporter reuses `redact`; never bypass it.
- `.` stays bundle-safe (no `node:*`); the console reporter writes through `console`, the OTLP drivers (logs, traces,
  metrics) through `fetch` via the shared `otlpExporter`. The tracer reaches `AsyncLocalStorage` only through
  `process.getBuiltinModule`, never an import.
- Span and metric attributes are ids and codes (ADR 0147 decision 3); a failed span records the error's code or class
  name, never its message.
- `src/{core,contracts}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339).
- `TelemetryConfig` holds no Sentry DSN and no error sampling: `SentryConfig` of `@stackra/errors` is the one Sentry
  source (ADR 0465). Never add them back; this package does not depend on `@stackra/errors`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data       | Where                  | Handling                                                                                |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Log fields | `LogRecord`, reporters | Credential and personal-data names, `@Classified` fields and token patterns are masked. |
