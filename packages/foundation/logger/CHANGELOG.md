# @stackra/logger

## 0.2.0

### Minor Changes

- 9085c41: OTLP for all three signals (ADR 0184 decision 1, STA-1572). `@stackra/contracts`: `Tracer` gains
  `continueTrace(carrier, work)` and `traceparent()` (implementers of `Tracer` must add both; `NoopTracerDriver` runs the
  work and names no parent), the `TraceCarrier` type, and a new `Metrics` port (counter, histogram, gauge) with
  `NoopMetricsDriver`. `@stackra/logger`: `OtlpTracerDriver` (spans to `/v1/traces`, nesting through
  `AsyncLocalStorage`, W3C trace continuation, the edge request id on every span, `traceSampleRatio` sampling) and
  `OtlpMetricsDriver` (cumulative sums, gauges and explicit-bucket histograms to `/v1/metrics` every
  `metricIntervalMs`), `parseTraceparent` and `formatTraceparent`; `OtlpConfig` adds `traceSampleRatio` and
  `metricIntervalMs`; the log reporter shares the batching sender, counts what it drops (`dropped`) and flushes on
  shutdown. `@stackra/transport`: the `traceContext(tracer)` middleware and `TRANSPORT_HEADERS.traceparent`.
  `@stackra/app`: the server `createApp` continues each request's trace (its `traceparent` and `x-figentra-request-id`,
  taken once the guards pass) when a `Tracer` is bound.

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- ae3d280: Add the `@stackra/logger/contracts` entry and move the `LogReporter` port into it with `LogLevel` and `LogRecord`;
  `@stackra/logger` no longer exports them. The config classes and schemas stay on `.`.
- e1f6e1d: Add `OtlpLogReporterDriver` with `OtlpConfig` (key `logger.otlp`): batched OTLP/JSON log export with the collector's
  headers by secret name.
- 2787c1e: Add `@stackra/logger`, logging of the programming model v3.1: `ChannelLoggerDriver`, the driver of the contracts
  `Logger` port, with the channel derived from the event's module key, global and per-channel levels and sampling of
  debug and info lines; `redact`, which masks built-in credential and personal-data field names, a host's
  `redaction.extraFields`, `@Classified` fields and secret shapes inside strings before any reporter sees a line; the
  `LogReporter` port with `ConsoleLogReporterDriver` (one JSON line per record); and the configurations `LoggingConfig`
  (`logger.logging`) and `TelemetryConfig` (`logger.telemetry`: DSN, error, trace and replay sampling, vitals, the ADR
  0183 budgets and the Lighthouse run) with their shipped schemas `LoggingConfig$` and `TelemetryConfig$`.
- 20f3fe9: One Sentry config (ADR 0465): `TelemetryConfig` drops `dsn` and `errors.sampleRate`; `SentryConfig` of
  `@stackra/errors` (`dsnSecret`, `sampleRate`) is their one source and a client reporter reads them there. A host
  override that sets `errors.sampleRate` or `dsn` must drop them; a leftover runway value is ignored by the schema.

### Patch Changes

- f9093c1: Auto-capture: `useAutocapture(path)` (web) tracks `page.viewed` per path and `element.clicked` for `data-track`
  elements, and `useScreenViews(screen)` (native) tracks `screen.viewed`, as `autocapturePageviews` and
  `autocaptureClicks` switch them on. Breaking: `AnalyticsConfig.webVitals` and `sessionReplay` are removed;
  `TelemetryConfig.vitals` and `replay` (@stackra/logger) are their one owner.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
