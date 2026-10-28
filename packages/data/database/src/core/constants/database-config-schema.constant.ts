/**
 * Stackra file contract:
 * Purpose: `DATABASE_CONFIG_SCHEMA`, the zod schema this package ships for `DatabaseConfig` (exported as
 *          `DatabaseConfig$`): the `health` field that tunes `DatabaseHealthIndicatorDriver` for `/readyz`, and the
 *          `timeouts` every runtime session starts with, the `pool` of one instance (ADR 0473), the
 *          `readYourWrites` window a replica query stays on the primary after its caller's write (STA-1504), and the
 *          `region` key of the deployment the database serves (stackra-310).
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `DatabaseConfig$` can `.extend` it. The defaults equal
 *           `DatabaseConfigOptions`' initializers (tested). No credential: the connection URL is the process's
 *           the Encore database's, read by the generated boot.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0473 (decision 2); registry gap R-27; gap analysis devx-ops
 *                     "Health checks" (P0, owner D10).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { CANONICAL_DURATION_SCHEMA } from "#core/constants/canonical-duration-schema.constant";

import { DATABASE_POOL_SCHEMA } from "#core/constants/database-pool-schema.constant";
import { HEALTH_CHECK_SCHEMA } from "#core/constants/health-check-schema.constant";
import { SESSION_TIMEOUTS_SCHEMA } from "#core/constants/session-timeouts-schema.constant";

/** The shipped `DatabaseConfig$`. */
export const DATABASE_CONFIG_SCHEMA = z.object({
  health: HEALTH_CHECK_SCHEMA,
  timeouts: SESSION_TIMEOUTS_SCHEMA,
  pool: DATABASE_POOL_SCHEMA,
  readYourWrites: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(5)),
  region: z
    .string()
    .regex(/^([a-z][a-z0-9-]*)?$/)
    .default(""),
});
