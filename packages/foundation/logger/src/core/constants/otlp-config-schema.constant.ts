/**
 * Stackra file contract:
 * Purpose: `OTLP_CONFIG_SCHEMA`, the zod schema this package ships for `OtlpConfig` (exported as `OtlpConfig$`): the
 *          collector endpoint, the service name, the headers secret's name and the batching bounds.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; the defaults equal `OtlpOptions`' initializers (tested). No secret value: only its name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173; ADR 0184.
 */
import { z } from "zod";

/** The shipped `OtlpConfig$`. */
export const OTLP_CONFIG_SCHEMA = z.object({
  endpoint: z.union([z.literal(""), z.url()]).default(""),
  serviceName: z.string().default(""),
  headersSecret: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/)
    .default("OTEL_EXPORTER_OTLP_HEADERS"),
  batchSize: z.number().int().min(1).max(10_000).default(100),
  flushIntervalMs: z.number().int().min(100).max(60_000).default(2000),
  maxQueue: z.number().int().min(1).default(2000),
});
