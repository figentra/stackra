---
"@stackra/logger": patch
---

`LoggingConfig` has a `reporter` field that picks the `LogReporter` driver: `console` by default, or `otlp`. Before, no config field selected one, so any member that injected `Logger` failed to boot with `UnresolvedPortError: No driver is bound to LogReporter` (BILLING-A), in production too.

A deployment that sends logs to a collector sets `reporter: otlp` in its runway values, next to `OtlpConfig`.
