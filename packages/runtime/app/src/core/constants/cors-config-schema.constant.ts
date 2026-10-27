/**
 * Stackra file contract:
 * Purpose: `CORS_CONFIG_SCHEMA`, the zod schema this package ships for `CorsConfig` (exported as `CorsConfig$`): the
 *          origins a browser may call the API from, the methods and request headers a preflight allows, whether
 *          credentials (the BFF cookie) travel, and how long a preflight answer is cached.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *          refinement, so `.parse({})` gives the full defaults. An origin is `scheme://host[:port]` with no path, so a
 *          typo cannot widen the list; there is no wildcard. The defaults equal `CorsOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0437 (server-check order).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's CorsOptions into #stackra/schemas; replace with STA-339.
/** The shipped `CorsConfig$`. */
export const CORS_CONFIG_SCHEMA = z.object({
  allowedOrigins: z.array(z.string().regex(/^https?:\/\/[^/\s]+$/)).default([]),
  allowedMethods: z
    .array(z.string().regex(/^[A-Z]+$/))
    .default(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"]),
  allowedHeaders: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .default(["content-type", "authorization", "x-stackra-csrf"]),
  allowCredentials: z.boolean().default(true),
  maxAgeSeconds: z.number().int().min(0).max(86_400).default(600),
});
