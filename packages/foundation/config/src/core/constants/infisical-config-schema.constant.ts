/**
 * Stackra file contract:
 * Purpose: `INFISICAL_CONFIG_SCHEMA`, the zod schema this package ships for `InfisicalConfig` (exported as
 *          `InfisicalConfig$`): the instance, project, environment and folder, and the two credential fields filled
 *          from secrets.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `InfisicalOptions`' initializers (tested). The credential fields default to
 *           empty: their values arrive only through the secret layer.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

/** The shipped `InfisicalConfig$`. */
export const INFISICAL_CONFIG_SCHEMA = z.object({
  siteUrl: z.union([z.literal(""), z.url()]).default(""),
  projectId: z.string().default(""),
  environment: z.string().default(""),
  path: z.string().startsWith("/").default("/"),
  clientId: z.string().default(""),
  clientSecret: z.string().default(""),
});
