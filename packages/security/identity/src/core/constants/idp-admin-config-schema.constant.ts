/**
 * Stackra file contract:
 * Purpose: `IDP_ADMIN_CONFIG_SCHEMA`, the zod schema this package ships for `IdpAdminConfig` (exported as
 *          `IdpAdminConfig$`): the identity provider's base URL, its admin token and how long a call may take.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the full
 *           defaults; the URL is an absolute URL or unset (unset means no admin calls can be made, and the driver
 *           refuses to start). The token is the `IDENTITY_IDP_ADMIN_TOKEN` secret and the events signing key the
 *           `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret, never values. The defaults equal
 *           `IdpAdminOptions`' initializers.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (secrets are names); ADR 0410 (STA-834); STA-1579.
 */
import { url } from "@stackra/validation";
import { z } from "zod";

/** The shipped `IdpAdminConfig$`. */
export const IDP_ADMIN_CONFIG_SCHEMA = z.object({
  url: z.union([url(), z.literal("")]).default(""),
  token: z.string().default(""),
  timeoutSeconds: z.number().int().min(1).max(120).default(15),
  eventsSigningKey: z.string().default(""),
});
