/**
 * Stackra file contract:
 * Purpose: `CSRF_CONFIG_SCHEMA`, the zod schema this package ships for `CsrfConfig` (exported as `CsrfConfig$`): the
 *          methods the CSRF and origin guards protect, the request header a browser call must carry, and the cookie
 *          whose value that header must repeat when double-submit is on.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default and there is no object-level
 *          refinement, so `.parse({})` gives the full defaults. An empty `tokenCookie` means custom-header mode (the
 *          header must be present; the CORS preflight it forces keeps other origins out). The defaults equal
 *          `CsrfOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0437 (server-check order).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's CsrfOptions into #stackra/schemas; replace with STA-339.
/** The shipped `CsrfConfig$`. */
export const CSRF_CONFIG_SCHEMA = z.object({
  protectedMethods: z
    .array(z.string().regex(/^[A-Z]+$/))
    .default(["POST", "PUT", "PATCH", "DELETE"]),
  headerName: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default("x-stackra-csrf"),
  tokenCookie: z
    .string()
    .regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]*$/)
    .default(""),
});
