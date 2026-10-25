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
| `TelemetryConfig`, `TelemetryConfig$` | key `logger.telemetry`: `dsn`, `errors`, `traces`, `replay`, `vitals`, `budgets`, `lighthouse`               |
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
