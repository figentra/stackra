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

import { DURATION_SCHEMA } from "#core/constants/duration-schema.constant";

/** The shipped `health` field: a two second probe whose failure fails readiness. */
export const HEALTH_CHECK_SCHEMA = z
  .object({
    timeout: DURATION_SCHEMA.default(Duration.seconds(2)),
    critical: z.boolean().default(true),
  })
  .default(() => ({ timeout: Duration.seconds(2), critical: true }));
