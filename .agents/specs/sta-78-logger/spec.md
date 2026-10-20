# Feature Specification: @stackra/logger — channel logging with pluggable reporters

**Feature Branch**: `figentra/sta-78-logger-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-78-logger/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-78

**Linear project**: Foundation kernel

**Clarifications status**: pending

**Input**: User description: "Port `@figentra-os/logger` to `packages/foundation/logger` as `@stackra/logger` (port + adapt, ADR 0084). Keep CloudWatch; add Encore log, Sentry and Better Stack reporters behind one driver contract with a conformance suite (ADR 0085, Round 8 F6). Roadmap W1.2: depends on container and config."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none (apps adopt the logger in later waves)
- **Services touched**: none (the generated Encore app passes the Encore logger in from Phase 3, ADR 0091)
- **Packages touched**: packages/foundation/logger (new); consumes packages/foundation/container, packages/foundation/config, packages/foundation/support and packages/foundation/contracts (STK diagnostics)
- **Cross-service events**: none. The in-process `logger.logged`, `logger.channel.created` and `logger.channel.disposed` notifications stay on the local bus port and are never integration events
- **Tenancy and data**: none. No tables. Log lines carry no personal data (ADR 0085 d4, 0071); a tenant id may appear only as a context key per the field dictionary [NEEDS CLARIFICATION: OB1 — recommended: a (OpenTelemetry conventions plus the Stackra field dictionary)]
- **Secrets**: `BetterStackSourceToken` as a secret reference in config, never a value (ADR 0044 d4, 0009) [NEEDS CLARIFICATION: FW3 — recommended: a (config declares secret refs; gen emits one Encore `secret()` per ref)]. The Sentry DSN is public configuration, not a secret (ADR 0020 rule 2). CloudWatch credentials come from the host's IAM role through the client the host passes in; the package holds none
- **ADR needed**: no for the port (ADR 0085 decides the reporters); the package design record required for adapt rows by ADR 0018 is written with the plan. The air-gapped reporter (0085 TODO, C32) is settled by the owner's OB2 answer, which may amend 0085
- **New dependencies**: `picocolors` to the default catalog via dependency-steward (the ported `pretty` formatter uses it). No vendor SDK: the Sentry, CloudWatch and Encore clients are passed in duck-typed; Better Stack goes over `fetch`
- **Deploy modes**: SaaS — Encore log, Sentry and Better Stack reporters on (ADR 0073 d1); CloudWatch available where the host runs on AWS. On-prem — stdout (ndjson) and file reporters always available; hosted reporters only when the customer's network reaches them and configures them. Air-gapped — no outbound reporter is configured and no reporter calls out on its own (ADR 0076 d3); stdout, file and Encore log (self-hosted) remain, and which aggregated reporter replaces the hosted ones is open [NEEDS CLARIFICATION: OB2 — recommended: a (everything exports OTLP; on-prem points it at the customer's stack); spike STA-142]
- **Lane**: full (ADR 0120 D4: a new package is R2 or higher; roadmap W1.2 row)
- **Change risk**: R3 — reporters make outbound HTTP calls (Better Stack, Sentry, CloudWatch) and the redaction step is the PII boundary for every log line (ADR 0120 D16 R3 row). Blocking security review before merge

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Log through one call site, routed by configuration (Priority: P1)

A package or service author injects a `Logger` and writes `info`/`warn`/`error` with structured meta. Which channel and which reporters receive the entry is decided only by configuration, so the same call works on web, native and Node and in every deploy mode.

**Why this priority**: every later package (database, actions, queue, app) depends on the logger contract and the container port. Without it nothing else can log.

**Independent Test**: build a container with `LoggerModule.forRoot` using the `memory` reporter, call each level on an injected logger and assert the captured entries with `expectLogged`.

**Acceptance Scenarios**:

1. **Given** a `single` channel `app` with level `info`, **When** a provider calls `log.debug(...)` and `log.info(...)`, **Then** only the `info` entry reaches the reporters.
2. **Given** a `stack` channel over `app` and `audit`, **When** an entry is written to the stack, **Then** enrichers run once and each sub-channel applies its own level and formatter.
3. **Given** a logger, **When** `child({ requestId })` is called, **Then** the child carries the merged context and the parent is unchanged.
4. **Given** channel config naming an unregistered reporter, **When** the container boots, **Then** boot fails with a `LoggerError` carrying an STK diagnostic code and the channel and reporter names.

---

### User Story 2 - Personal data never leaves the process (Priority: P1)

An operator configures redaction paths, and the package also masks a built-in list of known PII fields. Nothing a reporter, formatter, devtools tail, bus notification or emergency line sees contains a masked value.

**Why this priority**: ADR 0085 d4 and 0073 d6 forbid personal data in any telemetry, and every reporter is a data egress point.

**Independent Test**: log an entry whose meta and context hold values at configured and built-in PII paths through every shipped reporter (with fakes), and assert none of the raw values appears in any output.

**Acceptance Scenarios**:

1. **Given** `redact.paths: ["meta.*.token"]`, **When** an entry with `meta.user.token` is logged, **Then** every reporter receives `***` and the caller's object is not mutated.
2. **Given** a known PII field (for example `email`) not listed by the app, **When** it is logged in meta, **Then** it is masked by the default list.
3. **Given** a reporter that throws, **When** the emergency line reports it, **Then** only the error name and code are printed, never the entry or message.

---

### User Story 3 - Hosted reporters for SaaS: Encore log, Sentry, Better Stack, CloudWatch (Priority: P2)

A SaaS service sends structured logs to Encore's log pipeline, errors to Sentry and aggregated logs to Better Stack, and an AWS-hosted Node worker can still ship to CloudWatch, all selected by reporter name in channel config.

**Why this priority**: ADR 0085 d2–d3 and Round 8 F6 name these four reporters; the platform's observability (ADR 0073) depends on them, but the core logger is usable without them.

**Independent Test**: run each reporter against its fake client (Encore logger double, `FakeSentry`, fake `fetch`, fake CloudWatch client) and assert the mapping of level, message, context and error.

**Acceptance Scenarios**:

1. **Given** the `encore` reporter with an Encore logger passed in by the host, **When** an `error` entry with meta is written, **Then** the Encore logger's `error` is called with the message and the redacted fields, and the package never imports `encore.dev`.
2. **Given** the `sentry` reporter with level `error` and breadcrumb level `info`, **When** an `info` and an `error` entry are written, **Then** the first becomes a breadcrumb and the second a `captureException` or `captureMessage`.
3. **Given** the `betterstack` reporter, **When** entries are written faster than the flush interval, **Then** they are sent in batches with backoff and a bounded queue, and `flush()` awaits delivery.
4. **Given** the `cloudwatch` reporter on Node, **When** a batch exceeds 10 000 events or 1 048 576 bytes, **Then** it is chunked within CloudWatch limits.

---

### User Story 4 - One driver contract, proven by a conformance suite (Priority: P2)

A driver author writing a new reporter (for example an OTLP one) runs the shared conformance suite from `./testing` and knows the reporter honours the contract: isolation, flush, close, redaction and no outbound call when not configured.

**Why this priority**: ADR 0076 d5 and 0084 d1 require every driver package to ship a conformance suite, and the roadmap's done line names it.

**Independent Test**: run the suite against every shipped reporter with outbound network blocked.

**Acceptance Scenarios**:

1. **Given** any shipped reporter, **When** the conformance suite runs, **Then** it passes with no network access.
2. **Given** a reporter whose `write` rejects, **When** the suite runs, **Then** the failure is isolated: other reporters still receive the entry and the caller never sees the error.

---

### User Story 5 - Client error boundary and host reporters (Priority: P3)

A web or native app wraps a screen in `LoggerErrorBoundary`; a web app ships logs to its backend through the batched `http` reporter; a native app adds breadcrumbs to its crash SDK.

**Why this priority**: ported surface that apps use in Phase 7; not needed by the Phase 1–3 critical path.

**Independent Test**: render a throwing child under the boundary with the testing module and assert one entry and the fallback.

**Acceptance Scenarios**:

1. **Given** a boundary with `channel="app"`, **When** a child throws during render, **Then** one entry is logged at `error` with `boundary` and `componentStack` meta and the fallback renders.
2. **Given** the `http` reporter, **When** the page hides, **Then** the queue is sent through `sendBeacon` or a `keepalive` fetch.

### Edge Cases

- A reporter, formatter, enricher or stack sub-channel throws: the caller is unaffected, other reporters still run, the failure is counted and printed at most once per source per minute (source: `EmergencyReporter`).
- A `fatal` written just before a crash: dispatch is synchronous up to the reporters, so the entry is handed over before the process exits; `flush()` awaits pending promises.
- A stack channel that reaches itself: boot fails with the cycle path.
- A `logger.logged` listener that logs: the loop guard delivers the entry but does not re-emit it.
- Encore captures stdout as well as `encore.dev/log`: configuring both `stdout` and `encore` on one channel duplicates lines; the docs state one source per concern.
- Sentry plus the native `breadcrumb` reporter on one channel, or Sentry's `captureConsoleIntegration` plus `console`: duplicate events, documented as in the source.
- No `fetch` available for `http` or `betterstack`: a `LoggerError` with the `no_fetch` diagnostic at bootstrap, never at call time.
- Air-gapped host with a hosted reporter configured by mistake: the reporter fails closed (counted, never retried forever, never blocks the caller).
- The `error` field is not path-redacted: secrets must stay out of error messages (documented, as in the source).

## Requirements _(mandatory)_

### Functional Requirements

Port and adapt (ADR 0084 d1, d2 row "logger: port + adapt, reporters per 0085"):

- **FR-001**: The package SHALL be published as `@stackra/logger` in `packages/foundation/logger`, MIT-licensed, with `@figentra-os/*` names stripped (ADR 0083, 0084, Round 8 X5).
- **FR-002**: The package SHALL expose the source's entries: `.` (engine), `./contracts` (vocabulary only), `./react`, `./native`, `./node`, `./testing` and `./devtools`, declaring only entries that hold code (source `package.json` exports) [NEEDS CLARIFICATION: FW1 — recommended: a (entries first; `config/` and `resources/` outside `src`; supersedes 0004)].
- **FR-003**: Every file SHALL carry a file-contract docblock and every export a docblock; one export per file; `#` subpath imports; no `any`, non-null assertions, TypeScript `enum`s or `Reflect` metadata (ADR 0006, 0007, 0084 d1). The source's `*.enum.ts` frozen `as const` objects are kept as such.
- **FR-004**: Every `LoggerError` code (`unknown_reporter`, `unknown_formatter`, `unknown_channel`, `stack_cycle`, `invalid_level`, `no_fetch`, `collector_rejected`, `invalid_reporter_config`) and every container diagnostic the logger raises (source `FCN0013`, `FCN0014`) SHALL map to an STK-prefixed code in the diagnostics catalogue of `@stackra/contracts` (ADR 0084 d1, Round 8 X3, STA-74).
- **FR-005**: The package SHALL NOT import `encore.dev`, a vendor SDK or `@stackra/events`. The bus port `LOGGER_EVENT_BUS` SHALL stay duck-typed and fall back to a no-op bus, because `@stackra/events` lands after the logger (W1.3, STA-80) (ADR 0078 d8, 0085 enforcement, roadmap W1.2).

Core behaviour (ported unchanged, source README):

- **FR-006**: WHEN an entry is written, the logger SHALL run level gate → enrichers in order (sampling 0, timestamp 100, context 200, redaction 900, interpolation 950) → formatter → each reporter isolated → bus notification.
- **FR-007**: An entry SHALL pass WHEN its level is at or above `max(channel level, global floor)`; runtime overrides SHALL go only through `LOGGER_LEVELS`, and options SHALL be frozen.
- **FR-008**: Reporters, formatters, enrichers and channel drivers SHALL be discovered by their `@Reporter`/`@Formatter`/`@Enricher`/`@ChannelDriver` metadata through the container's discovery and WeakMap metadata store, with no registration call and no global logger (ADR 0005, 0042).
- **FR-009**: `bindContainerLogger` SHALL provide `LOGGER_PORT` over a named channel and log the container's event stream there; `createEventPort` SHALL adapt any package's event port without importing it.
- **FR-010**: IF a reporter, formatter, enricher or sub-channel throws, THEN the logger SHALL isolate the failure, count it, and print only the error name and code at most once per source per minute.

Redaction and PII (ADR 0085 d4, 0073 d6, 0020 rule 3, 0071):

- **FR-011**: Redaction SHALL run before interpolation, formatting, every reporter, the devtools tail, the bus and the emergency path, on a copy of the caller's data.
- **FR-012**: The package SHALL apply a default list of known PII field names in addition to configured `redact.paths`, and SHALL ship a test that fails when any known PII field reaches a reporter (ADR 0085 enforcement).
- **FR-013**: Bus notifications SHALL carry context and meta keys only and the error name only, never values.
- **FR-014**: Context keys SHALL follow the Stackra telemetry field dictionary (service, module, action `key@version`, actor type, via, tenant id, request, correlation, causation and trace ids, deploy mode) [NEEDS CLARIFICATION: OB1 — recommended: a].

Reporters (ADR 0085 d1–d3, Round 8 F6):

- **FR-015**: All reporters SHALL implement one `Reporter` contract (`name`, `write(entry, formatted)`, optional `flush()` and `close()`), and SHALL be selected by name in channel config only.
- **FR-016**: The package SHALL keep the built-in `console`, `silent` and `memory` reporters and the `pretty` and `json` formatters.
- **FR-017**: The package SHALL keep the `cloudwatch` reporter in `./node` with the source's batching (≤ 10 000 events, ≤ 1 048 576 bytes, 256 KiB per event, 24-hour span), 3 retries with exponential backoff from 500 ms and `unref`'d timers, taking a CloudWatch client from the host (ADR 0085 d2).
- **FR-018**: The package SHALL add an `encore` reporter that writes to an Encore logger passed in by the host as a container token and duck-typed (`info`/`warn`/`error`/`debug` with fields), mapping levels and passing redacted context and meta as fields; `stackra gen` provides the token in the generated app (ADR 0085 d3, 0042 d5, 0078 d8, 0091).
- **FR-019**: The package SHALL keep the host-neutral `sentry` reporter: it SHALL take an initialised Sentry client, never call `init`, `close` or `setUser`, capture entries at or above `level` (default `error`) and breadcrumb entries from `breadcrumbLevel` (default `info`) (ADR 0020 rules 1–3).
- **FR-020**: The package SHALL add a `betterstack` reporter that sends batched JSON over `fetch` to a configured ingest endpoint with a bounded queue, exponential backoff and `flush()`, reading its source token only from a resolved secret reference (ADR 0073 d1, 0044 d4, 0009).
- **FR-021**: The package SHALL keep the `stdout` (ndjson) and `file` (size rotation) reporters in `./node`, the `http` reporter in `./react` and the `breadcrumb` reporter in `./native`.
- **FR-022**: No reporter SHALL open a network connection unless it is configured on a channel; WHILE no outbound reporter is configured, the logger SHALL make no outbound call (ADR 0076 d3).

Config and testing:

- **FR-023**: The package defaults SHALL live in `config/logger.config.ts` outside `src`, publishable to and overridable by the host, replacing the source's `templates/config/logger.config.ts` (ADR 0044 d1–d3, roadmap W1.2 config row).
- **FR-024**: `./testing` SHALL export `createTestLoggerModule`, `MemoryReporter`, `FakeSentry`, `expectLogged`, `silentLogger`, `FakeClock`, fakes for the Encore logger, CloudWatch client and `fetch`, and a reporter conformance suite that every shipped reporter passes (ADR 0076 d5, 0084 d1).
- **FR-025**: The conformance suite SHALL run with outbound network blocked in the air-gapped CI job once it exists (ADR 0076 d6, spike STA-141) [NEEDS CLARIFICATION: TS18 — recommended: a (`--network none` container, nightly and on PRs touching drivers)].
- **FR-026**: Tests SHALL sit in `__tests__/` beside their subjects and meet the coverage floor [NEEDS CLARIFICATION: TS3 — recommended: a (80% lines and functions, 70% branches for the logger)] (ADR 0022).
- **FR-027**: WHERE the air-gapped mode needs an aggregated reporter, the package SHALL provide the reporter the owner selects [NEEDS CLARIFICATION: OB2 — recommended: a (an OTLP exporter reporter; settles 0085's TODO, C32)].

### Key Entities

- **LogEntry**: `level`, `message`, `meta`, `context`, `channel`, `time` (epoch ms from `LOGGER_CLOCK`), optional normalised `error` `{ name, message, stack? }`.
- **Logger**: per-channel facade with `trace`…`fatal`, `log`, `child`, `withContext`, `time`.
- **Channel**: a named instance built by a channel driver (`single`: reporters plus one formatter; `stack`: fan-out to channels).
- **Reporter**: the driver contract every sink implements; selected by name.
- **Formatter / Enricher**: per-channel output shaping / ordered entry transforms (sampling, timestamp, context, redaction, interpolation).
- **LoggerModuleOptions**: plain-data configuration (level, default, context, redact, sampling, instances, reporter settings).
- **LoggerError**: typed bootstrap error with an STK code, channel, subject and the registered names.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Every shipped reporter (console, silent, memory, stdout, file, cloudwatch, encore, sentry, betterstack, http, breadcrumb) passes the conformance suite with outbound network blocked.
- **SC-002**: The PII test logs every known PII field through every reporter and finds zero unmasked values in any output, bus payload or emergency line.
- **SC-003**: The package source contains zero imports of `encore.dev`, `@sentry/*`, `@aws-sdk/*`, `reflect-metadata` or `@stackra/events` (boundaries and knip green).
- **SC-004**: Coverage meets the floor agreed under TS3 (default 80% lines and functions, 70% branches).
- **SC-005**: A consumer switches a channel from `console` to `encore` plus `sentry` by changing configuration only, with zero code changes at call sites.
- **SC-006**: `pnpm verify` is green on the merge commit, and the package has a docs page and a changeset (roadmap common definition of done).

## Assumptions

- The container (STA-76) and config (STA-77) specs land first in W1.2, and contracts (STA-74) provides the STK diagnostics catalogue and error kinds.
- `@stackra/support` (STA-75, W1.1) remains a dependency, as in the source.
- The `./devtools` entry depends on `@stackra/devtools-kit` (STA-84, W1.3) as an optional peer; it is ported once that package exists, in a follow-up PR on this spec.
- Encore's logger is reached only through a host-provided token; until Phase 3 gen exists, tests use a fake.
- Log retention (OB11) is a platform concern outside this package.
- Tracing and metrics are out of scope (ADR 0073 d2: Encore tracing covers services).

## Glossary

- **Channel**: a named log destination built by a driver; selected by name.
- **Reporter**: a sink driver that receives formatted, redacted entries.
- **Stack channel**: a channel that fans one entry out to several channels.
- **Enricher**: an ordered transform applied to every entry before formatting.
- **Redaction**: masking values at configured or default paths before any sink.
- **Conformance suite**: the shared test set every reporter passes (ADR 0076 d5).
- **Emergency line**: the rate-limited `console.error` path for logger-internal failures.
- **Deploy modes**: SaaS, on-prem and air-gapped (ADR 0076 d1).
- **STK code**: a diagnostics catalogue code with the Stackra prefix (ADR 0084 d1).
- **Duck-typed client**: a vendor object passed in by the host and typed structurally, so the package never imports the vendor.

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: a] Entry layout and where `config/` lives (FR-002, FR-023).
- [NEEDS CLARIFICATION: FW3 — recommended: a] How the Better Stack source token is declared as a secret reference (Impact: Secrets, FR-020).
- [NEEDS CLARIFICATION: OB1 — recommended: a] Telemetry field dictionary for context keys (Impact: Tenancy, FR-014).
- [NEEDS CLARIFICATION: OB2 — recommended: a] The air-gapped aggregated reporter, 0085's TODO and C32 (Impact: Deploy modes, FR-027); spike STA-142.
- [NEEDS CLARIFICATION: TS18 — recommended: a] Mechanism of the air-gapped conformance job (FR-025); spike STA-141.
- [NEEDS CLARIFICATION: TS3 — recommended: a] Coverage floor for the logger (FR-026, SC-004).
