/**
 * Stackra file contract:
 * Purpose: `ACCESS_LOG_CONFIG_SCHEMA`, the zod schema this package ships for `AccessLogConfig` (exported as
 *          `AccessLogOptions$`): which sink runs, and how many days a record is kept.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated schema can `.extend` it; the defaults equal `AccessLogOptions`'
 *           initializers (tested). The retention floor is 90 days and the default 400, about the thirteen months hot
 *           that ADR 0212 decision 6 keeps.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0212 (decision 6: retention).
 */
import { z } from "zod";

import { ACCESS_LOG_SINK_DRIVERS } from "#core/constants/access-log-sink-drivers.constant";

/** The shipped `AccessLogOptions$`. */
export const ACCESS_LOG_CONFIG_SCHEMA = z.object({
  sink: z.enum(ACCESS_LOG_SINK_DRIVERS).default("postgres"),
  retentionDays: z.number().int().min(90).default(400),
});
