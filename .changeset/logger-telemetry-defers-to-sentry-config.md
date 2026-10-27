---
"@stackra/logger": minor
---

One Sentry config (ADR 0465): `TelemetryConfig` drops `dsn` and `errors.sampleRate`; `SentryConfig` of
`@stackra/errors` (`dsnSecret`, `sampleRate`) is their one source and a client reporter reads them there. A host
override that sets `errors.sampleRate` or `dsn` must drop them; a leftover runway value is ignored by the schema.
