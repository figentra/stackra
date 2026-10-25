/**
 * Stackra file contract:
 * Purpose: `SENTRY_CONFIG_SCHEMA`, the zod schema this package ships for `SentryConfig` (exported as `SentryConfig$`):
 *          the DSN secret's name, the environment, the release and the sampling rate.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; the defaults equal `SentryOptions`' initializers (tested). No secret value: only its name.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

/** The shipped `SentryConfig$`. */
export const SENTRY_CONFIG_SCHEMA = z.object({
  dsnSecret: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/)
    .default("SENTRY_DSN"),
  environment: z.string().default(""),
  release: z.string().default(""),
  sampleRate: z.number().min(0).max(1).default(1),
});
