/**
 * Stackra file contract:
 * Purpose: `HTTP_CONFIG_SCHEMA`, the zod schema this package ships for `HttpConfig` (exported as `HttpConfig$`): the
 *          largest request body a generated HTTP adapter reads, in bytes.
 * Boundary: the stand-in for what gen writes for this package. The field has a default and there is no object-level
 *           refinement, so `.parse({})` gives the full defaults. The default equals `HttpOptions`' initializer (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0237 (STA-2577 note: raw adapters).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's HttpOptions into #stackra/schemas; replace with STA-339.
/** The shipped `HttpConfig$`. */
export const HTTP_CONFIG_SCHEMA = z.object({
  maxBodyBytes: z.number().int().min(1).max(104_857_600).default(1_048_576),
});
