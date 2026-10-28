/**
 * Stackra file contract:
 * Purpose: `DATABASE_CONFIG_SCHEMA`, the zod schema this package ships for `DatabaseConfig` (exported as
 *          `DatabaseConfig$`): the `health` field that tunes `DatabaseHealthIndicatorDriver` for `/readyz`.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `DatabaseConfig$` can `.extend` it. The defaults equal
 *           `DatabaseConfigOptions`' initializers (tested). No credential: the connection URL is the process's
 *           `DATABASE_URL`, read by the app's boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); registry gap R-27; gap analysis devx-ops
 *                     "Health checks" (P0, owner D10).
 */
import { z } from "zod";

import { HEALTH_CHECK_SCHEMA } from "#core/constants/health-check-schema.constant";

/** The shipped `DatabaseConfig$`. */
export const DATABASE_CONFIG_SCHEMA = z.object({
  health: HEALTH_CHECK_SCHEMA,
});
