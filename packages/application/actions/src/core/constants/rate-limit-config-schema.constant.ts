/**
 * Stackra file contract:
 * Purpose: `RATE_LIMIT_CONFIG_SCHEMA`, the zod schema this package ships for `RateLimitConfig` (exported as
 *          `RateLimitConfig$`): one bucket per API area.
 * Boundary: the stand-in for what gen writes for this package. `areas` has a default, so `.parse({})` gives the full
 *           defaults, `.shape.areas.parse(undefined)` gives the default buckets and a host's generated `RateLimitConfig$`
 *           extends it with `Base$.shape.areas.unwrap().default(...)`. The defaults equal `RateLimitOptions`'
 *           initializers (tested). `per` is a canonical ISO 8601 duration.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0217 (decision 2).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

/** A canonical duration: any ISO 8601 text `Duration.parse` reads, normalised. */
const DURATION = z.string().transform((text, context) => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({ code: "custom", message: `"${text}" is not an ISO 8601 duration` });
    return z.NEVER;
  }
});

/** One area's bucket. */
const BUCKET = z.object({
  requests: z.number().int().positive(),
  per: DURATION,
  burst: z.number().int().positive(),
});

/** The shipped `RateLimitConfig$`. */
export const RATE_LIMIT_CONFIG_SCHEMA = z.object({
  areas: z.record(z.string(), BUCKET).default(() => ({
    public: { requests: 60, per: Duration.minutes(1), burst: 20 },
    app: { requests: 600, per: Duration.minutes(1), burst: 100 },
    admin: { requests: 300, per: Duration.minutes(1), burst: 60 },
    platform: { requests: 120, per: Duration.minutes(1), burst: 30 },
  })),
});
