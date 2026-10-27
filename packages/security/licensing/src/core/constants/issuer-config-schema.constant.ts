/**
 * Stackra file contract:
 * Purpose: `ISSUER_CONFIG_SCHEMA`, the zod schema this package ships for `IssuerConfig` (exported as `IssuerConfig$`):
 *          the `LicenceIssuer` driver name, the Keygen product token, the Stackra registry origin and its issuer token.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           defaults, equal to `IssuerOptions`' initializers (tested). The tokens are the `KEYGEN_PRODUCT_TOKEN` and
 *           `REGISTRY_ISSUER_TOKEN` secrets, never values in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (secrets are names); ADR 0178 (decision 2); ADR 0453 (decisions 14 and 15).
 */
import { z } from "zod";

import { LICENCE_ISSUER_DRIVERS } from "#core/constants/licence-issuer-drivers.constant";

/** An absolute origin, as `LicensingConfig.apiUrl`: `https:` (or `http:` for a loopback test server), no path. */
const ORIGIN = /^(https:\/\/[^\s/?#]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

/** The shipped `IssuerConfig$`. */
export const ISSUER_CONFIG_SCHEMA = z.object({
  driver: z.enum(LICENCE_ISSUER_DRIVERS).default("registry"),
  productToken: z.string().default(""),
  registryUrl: z.string().regex(ORIGIN).default("https://npm.stackra.figentra.com"),
  issuerToken: z.string().default(""),
});
