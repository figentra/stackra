/**
 * Stackra file contract:
 * Purpose: `HEALTH_CHECK_SCHEMA`, the zod schema of the `health` field of `DatabaseConfig`: how long `DatabaseHealthIndicatorDriver` waits for its
 *          probe, and whether a failed probe fails `/readyz` (`critical`) or only degrades it.
 * Boundary: an internal part of this package's shipped config schema, not exported. A timeout reads either duration form (stackra-223) and is stored canonical. Every field has a default, so
 *           `.parse({})` gives the defaults the options class initializes (tested). Runway sets it per environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); registry gap R-27; gap analysis devx-ops "Health checks" (P0, owner D10).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

/** A duration in ISO 8601 (`PT2S`) or the short form (`2s`), read into its canonical form so a driver can time it. */
const TIMEOUT = z.string().transform((text, context): Duration => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({ code: "custom", message: `"${text}" is not a duration such as PT2S or 2s` });
    return z.NEVER;
  }
});

/** The shipped `health` field: a two second probe whose failure fails readiness. */
export const HEALTH_CHECK_SCHEMA = z
  .object({
    timeout: TIMEOUT.default(Duration.seconds(2)),
    critical: z.boolean().default(true),
  })
  .default(() => ({ timeout: Duration.seconds(2), critical: true }));
