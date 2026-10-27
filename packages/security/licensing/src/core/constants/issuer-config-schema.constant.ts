/**
 * Stackra file contract:
 * Purpose: `ISSUER_CONFIG_SCHEMA`, the zod schema this package ships for `IssuerConfig` (exported as `IssuerConfig$`):
 *          the `LicenceIssuer` driver name and the Keygen product token.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           defaults, equal to `IssuerOptions`' initializers (tested). The token is the `KEYGEN_PRODUCT_TOKEN` secret,
 *           never a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (secrets are names); ADR 0178 (decision 2).
 */
import { z } from "zod";

import { LICENCE_ISSUER_DRIVERS } from "#core/constants/licence-issuer-drivers.constant";

/** The shipped `IssuerConfig$`. */
export const ISSUER_CONFIG_SCHEMA = z.object({
  driver: z.enum(LICENCE_ISSUER_DRIVERS).default("keygen"),
  productToken: z.string().default(""),
});
