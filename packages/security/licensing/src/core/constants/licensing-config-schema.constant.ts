/**
 * Stackra file contract:
 * Purpose: `LICENSING_CONFIG_SCHEMA`, the zod schema this package ships for `LicensingConfig` (exported as
 *          `LicensingConfig$`): an absolute `https:` origin, the account, and a 64-hex verify key or nothing.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the defaults and a member's generated schema can extend it. The defaults
 *           equal `LicensingOptions`' initializers (tested). `checkLicenceKey` reads the default origin from here, so
 *           the origin lives in one place: the configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0178; owner round 3 #37.
 */
import { z } from "zod";

/** An absolute origin: `https:` (or `http:` for a loopback test server), no path, query or fragment. */
const ORIGIN = /^(https:\/\/[^\s/?#]+|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

/** The shipped `LicensingConfig$`. */
export const LICENSING_CONFIG_SCHEMA = z.object({
  apiUrl: z.string().regex(ORIGIN).default("https://api.keygen.sh"),
  account: z.string().default(""),
  publicKey: z
    .string()
    .regex(/^([0-9a-f]{64})?$/i)
    .default(""),
});
