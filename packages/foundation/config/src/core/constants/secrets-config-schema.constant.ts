/**
 * Stackra file contract:
 * Purpose: `SECRETS_CONFIG_SCHEMA`, the zod schema this package ships for `SecretsConfig` (exported as
 *          `SecretsConfig$`): which `SecretStore` driver runs.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `SecretsOptions`' initializers (tested). A driver name only, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173.
 */
import { z } from "zod";

import { SECRET_STORE_DRIVERS } from "#core/constants/secret-store-drivers.constant";

/** The shipped `SecretsConfig$`. */
export const SECRETS_CONFIG_SCHEMA = z.object({
  store: z.enum(SECRET_STORE_DRIVERS).default("memory"),
});
