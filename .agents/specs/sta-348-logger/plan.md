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

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation`, `@stackra/config`,
  `zod` only; no app, service or `encore.dev`; no vendor SDK.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; drivers `<Name>Driver`, the port `LogReporter`; codes snake_case.
- Secrets: none held; secret shapes masked in log text; tests use canaries.
- No parameter properties and no `#private` fields.
