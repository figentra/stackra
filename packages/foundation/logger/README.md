# @stackra/logger

Stackra logging: the driver behind the `Logger` port of `@stackra/contracts`, with per-channel levels, sampling and
redaction, the `LogReporter` port with its console driver, and two configurations, `LoggingConfig` and
`TelemetryConfig`, with the schemas they ship.

**Tier:** `tier:lib` (`packages/foundation/logger`). Entries `.` and `./contracts`. Depends on `@stackra/contracts`,
`@stackra/container`, `@stackra/validation`, `@stackra/config` and zod.

## What is here

| Symbol                                | Use                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `LoggingConfig`, `LoggingConfig$`     | key `logger.logging`: `level`, `channels`, `sampleRate`, `redaction.extraFields`                             |
| `TelemetryConfig`, `TelemetryConfig$` | key `logger.telemetry`: `errors`, `traces`, `replay`, `vitals`, `budgets`, `lighthouse`                      |
| `LoggingOptions`, `TelemetryOptions`  | the shapes of the two configurations, for restating a field type in an override                              |
| `ChannelLoggerDriver`                 | the driver of `Logger`: filters, samples, redacts, hands a `LogRecord` to the reporter                       |
| `ConsoleLogReporterDriver`            | where records go (the `LogReporter` port, `./contracts`); the console driver writes one JSON line per record |
| `LogLevel` (`./contracts`)            | `debug`, `info`, `warn`, `error`, lowest first                                                               |
| `redact`                              | the redaction every line passes; reusable by another reporter                                                |
| `LogRecord` (`./contracts`)           | type: `{ time, level, event, channel, fields }`                                                              |

## Logging

Code logs through the contracts port, never through this package:

```ts
constructor(logger: Logger) { ... }

this.logger.info("orders.draft_priced", { orderId, lines: 3 });
this.logger.error("orders.payment_failed", { orderId, cause: error });
```

The channel is the event's first segment (`orders`). A line is written when its level reaches the channel's level
(`channels.orders`), or the global `level` when the channel has none. Debug and info lines are kept at `sampleRate`;
warnings and errors always are.

## Redaction

Before any reporter sees a line, `redact`:

- masks a field whose name, lower-cased with punctuation removed, ends with a built-in credential or personal-data name
  (`password`, `token`, `apikey`, `email`, `phone`, ...) or with one of `redaction.extraFields`;
- masks the `@Classified` fields of a shape instance;
- masks bearer tokens, JWTs, well-known API keys and URL credentials inside any string;
- turns errors into `{ name, message, stack, cause, ...own fields }`, dates into ISO strings and bigints into strings;
  cycles become `"[circular]"` and nesting past eight levels `"[truncated]"`.

## Overriding

```ts
// services/commerce/src/config/logging.config.ts
import { LoggingConfig as BaseLoggingConfig } from "@stackra/logger";

export class LoggingConfig extends BaseLoggingConfig {
  override redaction = {
    ...new BaseLoggingConfig().redaction,
    extraFields: ["customerId", "paymentId"],
  };
}
```

A nested object is replaced whole, so an override spreads a base instance's value (tsc refuses `this.<field>` in
the field's own initializer). `TelemetryConfig` defaults are dev-safe: nothing is reported, no replay, ADR 0183's
budgets, no Lighthouse path.

`TelemetryConfig` holds no DSN and no error sampling (ADR 0465): `SentryConfig` of `@stackra/errors` is the one Sentry
source (`dsnSecret`, `sampleRate`), and a client reporter reads both there. `errors.enabled` and `errors.nativeCrashes`
stay here.

`TelemetryConfig` is the one owner of web vitals (`vitals.enabled`) and session replay (`replay`, gated by its
`consent` category). `AnalyticsConfig` (@stackra/analytics) dropped its `webVitals` and `sessionReplay` switches
(stackra-409): move a `analytics.webVitals: true` value to `logger.telemetry.vitals.enabled` and an
`analytics.sessionReplay` value to `logger.telemetry.replay`; a leftover value is dropped by the analytics schema.

Migrating: move a `logger.telemetry.dsn` value to the secret `SentryConfig.dsnSecret` names and
`errors.sampleRate` to `errors.sentry.sampleRate`; a leftover value is dropped by the schema.

## OTLP

`OtlpLogReporterDriver` (driver name `otlp`, the production default of ADR 0147) batches redacted records and POSTs
them as OTLP/JSON to `<endpoint>/v1/logs`. `OtlpConfig` (key `logger.otlp`) sets the collector, the `service.name`, the
batch size, the flush interval and the queue bound; the collector's headers are one secret in the OpenTelemetry form
(`OTEL_EXPORTER_OTLP_HEADERS`, `k=v,k2=v2`). A failed send drops its batch and the oldest records go first past
`maxQueue`; both are counted in `dropped`. Call `flush()` before a process or a Worker request ends; shutdown flushes.

The same `OtlpConfig` and collector take the other two signals (ADR 0184 decision 1), through one shared batching
sender (`fetch` only, no OpenTelemetry SDK):

- `OtlpTracerDriver` (the `Tracer` port of `@stackra/contracts`, driver name `otlp`) POSTs spans to
  `<endpoint>/v1/traces`: resource `service.name`, hex trace and span ids, the parent, kind (`server` for the first
  span of a continued inbound trace, else `internal`), nanosecond times, attributes, status, and an `exception` event
  with the error's code or class name (never its message). Spans nest through `AsyncLocalStorage`, taken with
  `process.getBuiltinModule` so `.` keeps no `node:` import; without it (a browser) every span is a root.
  `continueTrace` joins an inbound `traceparent` and stamps every span with the edge's `requestId`; the server app of
  `@stackra/app` calls it for each request. `traceSampleRatio` samples new traces; a continued trace follows its
  caller's flag. `parseTraceparent` and `formatTraceparent` are the W3C helpers.
- `OtlpMetricsDriver` (the `Metrics` port, driver name `otlp`) aggregates counters, gauges and explicit-bucket
  histograms (the OpenTelemetry default bounds) per name and attribute set, and every `metricIntervalMs` POSTs their
  cumulative values to `<endpoint>/v1/metrics`. A lost send loses no count; past `maxQueue` series a new one is
  dropped.

A failing collector never reaches the traced or measured code.
