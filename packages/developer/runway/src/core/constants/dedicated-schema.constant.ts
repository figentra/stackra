/**
 * Stackra file contract:
 * Purpose: `DEDICATED_SCHEMA`, one `environments.<env>.dedicated.<key>` entry of the root runway: a deployment of the
 *          environment's services for one tenant, in its own account or project, on the environment's release train.
 *          It names the tenant, its cloud, the regions it runs in (the environment's when absent) and the Encore Cloud
 *          settings of its own app environment.
 * Boundary: internal; the root environment schema composes it. Strict at its top, as the canonical `$defs/dedicated`
 *           is; the Encore block stays open for the provider to read. The tenant is an id, never a name or a person.
 * Runtime: isomorphic
 * Governing contract: ADR 0400 (the dedicated profile), ADR 0354 (decision 4), ADR 0170 (one release train).
 */
import { z } from "zod";

import { ENVIRONMENT_CLOUD_SCHEMA } from "#core/constants/environment-cloud-schema.constant";
import { OPEN_OBJECT_SCHEMA } from "#core/constants/open-object-schema.constant";

/** One dedicated deployment. */
export const DEDICATED_SCHEMA = z.strictObject({
  tenant: z.string().min(1),
  cloud: ENVIRONMENT_CLOUD_SCHEMA,
  regions: z
    .array(z.string())
    .refine((keys) => new Set(keys).size === keys.length, "A region is listed more than once")
    .optional(),
  encore: OPEN_OBJECT_SCHEMA.optional(),
});
