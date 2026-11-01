/**
 * Stackra file contract:
 * Purpose: `PAYMENTS_CONFIG_SCHEMA`, the zod schema this package ships for `PaymentsConfig` (exported as
 *          `PaymentsConfig$`): the platform Connection that serves each provider in each Market of this deployment.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; the defaults equal `PaymentsOptions`' initializers (tested). Connection ids only, never a
 *           secret: the credentials stay in the connection store.
 * Runtime: isomorphic
 * Governing contract: ADR 0370; ADR 0356 (decisions 3 and 5); ADR 0294 (decision 26: a package ships its own `X$`).
 */
import { z } from "zod";

/** The shipped `PaymentsConfig$`. */
export const PAYMENTS_CONFIG_SCHEMA = z.object({
  platformConnections: z
    .record(z.string().min(1), z.record(z.string().min(1), z.string().min(1)))
    .default({}),
});
