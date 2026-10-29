/**
 * Stackra file contract:
 * Purpose: `BEARER_CONFIG_SCHEMA`, the zod schema this package ships for `BearerConfig` (exported as `BearerConfig$`):
 *          the issuer whose keys sign the access tokens, the audience they must name, the clock leeway on `exp` and
 *          `nbf`, and how long the issuer's key set is cached.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *          refinement, so `.parse({})` gives the full defaults. An empty issuer or audience is allowed here and makes
 *          the bearer-token guard refuse every token (fail closed). The defaults equal `BearerOptions`' initializers
 *          (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0206 (decision 8).
 */
import { url } from "@stackra/validation";
import { z } from "zod";

// shortcut: authored until gen compiles this package's BearerOptions into #stackra/schemas; replace with STA-339.
/** The shipped `BearerConfig$`. */
export const BEARER_CONFIG_SCHEMA = z.object({
  issuer: z.union([url(), z.literal("")]).default(""),
  audience: z.string().default(""),
  leewaySeconds: z.number().int().min(0).max(300).default(60),
  keysSeconds: z.number().int().min(60).max(86_400).default(3600),
});
