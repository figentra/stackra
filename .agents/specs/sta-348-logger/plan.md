# Plan: `@stackra/logger` wave 2

**Spec**: `.agents/specs/sta-348-logger/spec.md`

## Design

- `LoggingOptions` and `TelemetryOptions` are `Schema` classes in `src/core/schemas/` whose initializers are the
  defaults; each registers this package's hand-written zod schema (`LOGGING_CONFIG_SCHEMA`, `TELEMETRY_CONFIG_SCHEMA`
  in `src/core/constants/`) for itself, as `CursorInput` does in validation. The barrel re-exports them as
  `LoggingConfig$` and `TelemetryConfig$`. Every field and nested field has a zod default, so the generated host form
  `Base$.shape.x.unwrap().default(() => ({ ...Base$.shape.x.parse(undefined), ... }))` works and a partial runway
  nested value parses.
- `LoggingConfig` and `TelemetryConfig` are `Config({ schema })` classes in `src/config/`; `configKey` derives
  `logger.logging` and `logger.telemetry`. No env map: the telemetry DSN's variable differs per target.
- `ChannelLoggerDriver extends Driver(Logger)` takes `LoggingConfig`, `LogReporter` and `Clock` by constructor. The
  channel is the event's first dot segment; the threshold is `channels[channel]` (own property only) or `level`; debug
  and info are kept when `Math.random() < sampleRate`. Fields pass `redact(fields, redaction.extraFields)`; a throwing
  reporter is caught and reported on `console.error` with names only.
- `LogReporter` is a port in `src/core/ports/` (no `./contracts` entry); `ConsoleLogReporterDriver` writes
  `console[level](JSON.stringify(record))`.
- `redact` walks the value: field-name match by normalised suffix against `REDACTED_FIELDS` plus extra fields,
  `Classified.members(constructor)` for class instances, `SECRET_PATTERNS` on every string, errors/dates/bigints made
  JSON-safe, path-only cycle detection and a depth of eight.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/logger`; workspace imports: `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | every log line is redacted before a reporter sees it; the package stores no secret                                                                                                                   |
| Security                              | PASS   | redaction runs before any reporter; a log call never throws                                                                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                                         |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                                                       |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                                               |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                                                                     |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                                            |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                                                    |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                                                      |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                                                   |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                                              |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` only; no app, service or `encore.dev`; no vendor SDK.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`, the port `LogReporter`; codes snake_case.
- Secrets: none held; secret shapes masked in log text; tests use canaries.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service                                            |
| On-prem    | identical: the same build, no SaaS-only code path                                                           |
| Air-gapped | identical: the shipped console reporter makes no network call; any remote reporter is the consumer's choice |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` — Validates: FR-001
- **P-002**: `.` exports `LoggingConfig`, `LoggingConfig$`, `TelemetryConfig`, `TelemetryConfig$`, `ChannelLoggerDriver`, `LogReporter`, `ConsoleLogReporterDriver`, `LogLevel`, `LoggingOptions`, `TelemetryOptions`, `redact` and `LogRecord` — Validates: FR-002
- **P-003**: `redact` runs on every log line before any `LogReporter` sees it, and a log call returns normally even when a reporter throws — Validates: FR-003
- **P-004**: `package.json` lists no vendor SDK, and `ConsoleLogReporterDriver` opens no network connection — Validates: FR-004
