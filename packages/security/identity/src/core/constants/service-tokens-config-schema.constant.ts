/**
 * Stackra file contract:
 * Purpose: `SERVICE_TOKENS_CONFIG_SCHEMA`, the shipped schema of `ServiceTokensOptions`: the issuer, the name of the
 *          secret that holds the service account's key, how long before expiry a token is renewed and how long one
 *          token request may take, each with its safe default.
 * Boundary: authored until gen compiles `ServiceTokensOptions` into `#stackra/schemas` (STA-339); exported as
 *           `ServiceTokensConfig$`. The key is never a value here, only the name of the secret (ADR 0173).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0173 (secrets are names); ADR 0209 (decision 3).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's ServiceTokensOptions into #stackra/schemas; replace with STA-339.
/** The shipped `ServiceTokensConfig$`. */
export const SERVICE_TOKENS_CONFIG_SCHEMA = z.object({
  issuer: z
    .string()
    .regex(/^(|https?:\/\/[^\s/]+(\/\S*)?)$/, "Expected empty or the issuer's http(s) URL")
    .default(""),
  keySecret: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, "Expected a secret name (IDENTITY_SERVICE_ACCOUNT_KEY)")
    .default("IDENTITY_SERVICE_ACCOUNT_KEY"),
  skewSeconds: z.number().int().min(0).max(3600).default(60),
  timeoutSeconds: z.number().int().min(1).max(120).default(10),
});
