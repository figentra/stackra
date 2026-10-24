/**
 * Stackra file contract:
 * Purpose: `LOGGING_CONFIG_SCHEMA`, the zod schema this package ships for `LoggingConfig` (exported as
 *          `LoggingConfig$`): the level, per-channel levels, the sample rate and the redaction.
 * Boundary: the stand-in for what gen writes for this package. Every field and every nested field has a default, so
 *           `.parse({})` gives the full defaults, `.shape.redaction.parse(undefined)` gives the nested default and a
 *           host's generated `LoggingConfig$` extends it with `Base$.shape.<field>.unwrap().default(...)`. The defaults
 *           equal `LoggingOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0147 (decision 1).
 */
import { z } from "zod";

/** The `LogLevel` codes, lowest first. */
const LEVEL = z.enum(["debug", "info", "warn", "error"]);

/** The shipped `LoggingConfig$`. */
export const LOGGING_CONFIG_SCHEMA = z.object({
  level: LEVEL.default("info"),
  channels: z.record(z.string(), LEVEL).default(() => ({})),
  sampleRate: z.number().min(0).max(1).default(1),
  redaction: z
    .object({ extraFields: z.array(z.string()).default(() => []) })
    .default(() => ({ extraFields: [] })),
});
