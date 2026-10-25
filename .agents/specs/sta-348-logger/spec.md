# Feature Specification: `@stackra/logger` wave 2, channels, reporters and redaction

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/logger` (foundation, wave 2) for real: `LoggingConfig` and `TelemetryConfig` with their
shipped schemas, the driver of the contracts `Logger` port with channels, sampling and redaction, and the reporter
port with its console driver.

## Impact

- **Apps touched**: none (the template's apps override `TelemetryConfig`; STA-344)
- **Services touched**: none (the template's commerce service overrides `LoggingConfig`; STA-344)
- **Packages touched**: `packages/foundation/logger` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no tables. Log lines carry no personal data (ADR 0184 decision 5): redaction runs before
  every reporter
- **Secrets**: none held. Secret shapes in log text are masked (ADR 0147 decision 1)
- **ADR needed**: no (ADR 0147, 0184, 0183, 0294 decisions 19, 20 and 26; ADR 0127 2026-10-24 note for entries)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/container`, `@stackra/validation`,
  `@stackra/config` through `workspace:*`; `zod` through `catalog:`
- **Deploy modes**: same in all; the console reporter makes no outbound call (air-gapped safe)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/logger/README.md`, `packages/foundation/logger/AGENTS.md`; ADR 0085, 0120, 0127, 0147, 0183, 0184, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (the redaction step is the PII boundary of every log line)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entry `.` only, depends on config; ADR 0147 supersedes 0085:
  drivers are console, OTLP and Better Stack, no vendor SDK; the older STA-78 port spec is superseded by this one

## User Scenarios & Testing

### User Story 1 - Log through the port, routed by configuration (Priority: P1)

A service injects `Logger` and writes `info("orders.draft_priced", fields)`. `ChannelLoggerDriver` derives the channel
`orders`, applies `channels.orders` or the global `level`, samples debug and info at `sampleRate`, and hands one
`LogRecord` to `LogReporter`.

**Independent Test**: `src/core/drivers/__tests__/channel-logger.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** `level: "warn"`, **Then** debug and info lines are dropped, warn and error are written.
2. **Given** `channels: { orders: "debug" }`, **Then** an `orders.*` debug line is written and a `catalogue.*` one is
   not.
3. **Given** `sampleRate: 0`, **Then** debug and info are dropped and warn and error are kept.
4. **Given** a reporter that throws, **Then** the caller does not fail and `console.error` gets only the reporter's class
   and the error's name.

### User Story 2 - Personal data never leaves the process (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/redact.function.test.ts`.

1. **Given** a built-in name (`password`, `apiKey`, `email`) in any casing or nesting, **Then** it is masked.
2. **Given** `redaction.extraFields: ["customerId"]`, **Then** `customerId`, `customer_id` and `stripeCustomerId` are
   masked.
3. **Given** a shape instance with a `@Classified` field, **Then** that field is masked.
4. **Given** a bearer token, JWT, API key or URL credentials inside a string, **Then** it is masked in place.
5. **Given** an error, a date, a bigint, a cycle or deep nesting, **Then** the result is JSON-safe and the input is
   unchanged.

### User Story 3 - Configure logging and telemetry (Priority: P1)

**Independent Test**: `src/config/__tests__/{logging,telemetry}.config.test.ts`,
`src/core/schemas/__tests__/{logging,telemetry}-options.schema.test.ts`.

1. **Given** `LoggingConfig` and `TelemetryConfig`, **Then** their keys are `logger.logging` and `logger.telemetry`.
2. **Given** the template's overrides (commerce's `redaction`, mobile's, console's and web's nested objects), **Then**
   they type-check and build over the base values.
3. **Given** `LoggingConfig$` and `TelemetryConfig$`, **Then** every top-level field is a zod default whose
   `.unwrap()` and `.parse(undefined)` work, as the template's generated schemas call them, and the output type equals
   the options class's `Fields`.

## Requirements

- **FR-001**: One entry, `.` (registry row, ADR 0127 2026-10-24 note).
- **FR-002**: `.` exports `LoggingConfig`, `LoggingConfig$`, `TelemetryConfig`, `TelemetryConfig$` (template) and
  `ChannelLoggerDriver`, `LogReporter`, `ConsoleLogReporterDriver`, `LogLevel`, `LoggingOptions`, `TelemetryOptions`,
  `redact`, `LogRecord` (registry purpose: channels, reporters, redaction).
- **FR-003**: Every log line is redacted before any reporter sees it; a log call never throws.
- **FR-004**: No vendor SDK, no network in the shipped reporter (ADR 0147).

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/logger` exists with the shape it uses:
  `LoggingConfig` (`redaction.extraFields`), `LoggingConfig$` (`.shape.redaction.unwrap()`, `.parse(undefined)`,
  `.extend`), `TelemetryConfig` (`errors.{enabled,sampleRate,nativeCrashes}`, `traces.sampleRate`,
  `replay.{onErrorSampleRate,consent}`, `vitals.enabled`, `budgets.{lcpMs,inpMs,cls,entryKb,routeKb,coldStartMs}`,
  `lighthouse.{paths,runs,minScores}`), `TelemetryConfig$` (same calls).
- **SC-002**: A test beside every public symbol, plus the barrel test, passes in the testing workflow.
- **SC-003**: No canary secret reaches a record or the fallback line in the tests.

## Not in this build

- The OTLP and Better Stack reporters of ADR 0147 and a `reporter` driver selector: they need endpoint and secret
  configuration; the `LogReporter` port is their seam.
- Automatic request-scope context (ADR 0147 decision 1): it needs the action pipeline's request context (W3); until
  then callers pass ids in `fields`.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
