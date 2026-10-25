---
"@stackra/logger": minor
---

Add `@stackra/logger`, logging of the programming model v3.1: `ChannelLoggerDriver`, the driver of the contracts
`Logger` port, with the channel derived from the event's module key, global and per-channel levels and sampling of
debug and info lines; `redact`, which masks built-in credential and personal-data field names, a host's
`redaction.extraFields`, `@Classified` fields and secret shapes inside strings before any reporter sees a line; the
`LogReporter` port with `ConsoleLogReporterDriver` (one JSON line per record); and the configurations `LoggingConfig`
(`logger.logging`) and `TelemetryConfig` (`logger.telemetry`: DSN, error, trace and replay sampling, vitals, the ADR
0183 budgets and the Lighthouse run) with their shipped schemas `LoggingConfig$` and `TelemetryConfig$`.
