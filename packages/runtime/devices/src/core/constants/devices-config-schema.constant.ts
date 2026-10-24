/**
 * Stackra file contract:
 * Purpose: `DEVICES_CONFIG_SCHEMA`, the zod schema this package ships for `DevicesConfig` (exported as
 *          `DevicesConfig$`): the hub's URL, the time one call may take and the attempts per call.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `DevicesConfig$` extends it. The defaults equal `DevicesOptions`'
 *           initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0235 (decision 2).
 */
import { z } from "zod";

/** The shipped `DevicesConfig$`. */
export const DEVICES_CONFIG_SCHEMA = z.object({
  hubUrl: z.url().nullable().default(null),
  timeoutMs: z.number().int().min(1).default(10_000),
  attempts: z.number().int().min(1).max(10).default(3),
});
