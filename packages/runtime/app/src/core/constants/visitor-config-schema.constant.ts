/**
 * Stackra file contract:
 * Purpose: `VISITOR_CONFIG_SCHEMA`, the zod schema this package ships for `VisitorConfig` (exported as `VisitorConfig$`):
 *          the HMAC keys that sign a visitor's identity (the current one and the one it replaced), the request header
 *          and cookie that carry it back, and how long the cookie lives.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults. An empty `signingKey` means no visitor identity: each
 *           anonymous call is a new visitor, as before. The defaults equal `VisitorOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0437 (server-check order).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's VisitorOptions into #stackra/schemas; replace with STA-339.
/** The shipped `VisitorConfig$`. */
export const VISITOR_CONFIG_SCHEMA = z.object({
  signingKey: z.string().default(""),
  previousSigningKey: z.string().default(""),
  headerName: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default("stackra-visitor"),
  cookieName: z
    .string()
    .regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/)
    .default("stackra_visitor"),
  cookieMaxAgeDays: z.number().int().min(1).max(400).default(365),
});
