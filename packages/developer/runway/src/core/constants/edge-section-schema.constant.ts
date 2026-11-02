/**
 * Stackra file contract:
 * Purpose: `EDGE_SECTION_SCHEMA`, the root runway's `edge` block as a closed object, so a misspelt key fails
 *          `parseRunway` instead of passing silently.
 * Boundary: internal; validation only, with no defaults. infra-cloudflare stays authoritative and parses the block
 *           with its own `EDGE_SCHEMA` and defaults. It depends on @stackra/runway, so this mirrors its keys and value
 *           rules rather than import them; a key added there is added here in the same change. `analyticsProxy`, which
 *           another owner reads, is kept.
 * Runtime: isomorphic
 * Governing contract: ADR 0296; ADR 0175; the Runway inventory of 2026-11-02 (static/ finding 1); STA-1976.
 */
import { z } from "zod";

/** The edge, as infra-cloudflare's `EDGE_SCHEMA` reads it (ADR 0175). */
export const EDGE_SECTION_SCHEMA = z.strictObject({
  proxy: z.enum(["all", "none"]).optional(),
  waf: z.enum(["managed", "off"]).optional(),
  bots: z
    .strictObject({ mode: z.enum(["off", "likely-automated-challenge"]).optional() })
    .optional(),
  rateLimit: z
    .strictObject({
      perIp: z.strictObject({ requests: z.int().min(1), periodSeconds: z.int().min(1) }).optional(),
    })
    .optional(),
  tls: z
    .strictObject({
      minVersion: z.enum(["1.0", "1.1", "1.2", "1.3"]).optional(),
      hsts: z.boolean().optional(),
    })
    .optional(),
  apiHost: z
    .string()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Expected a DNS label")
    .optional(),
  analyticsProxy: z.string().regex(/^\//, "Expected a path starting with /").optional(),
});
