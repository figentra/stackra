/**
 * Stackra file contract:
 * Purpose: `EDGE_CONFIG_SCHEMA`, the zod schema this package ships for `EdgeConfig` (exported as `EdgeConfig$`): which
 *          driver answers the edge signing keys and which keeps the seen request ids, and the `env` driver's secret.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the full
 *          defaults; they equal `EdgeOptions`' initializers (tested). `signingKeys` is the `STACKRA_EDGE_SIGNING_KEYS`
 *          secret, empty when unset.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0437 (decision 4); ADR 0173.
 */
import { z } from "zod";

import { EDGE_DRIVERS } from "#core/constants/edge-drivers.constant";

// shortcut: authored until gen compiles this package's EdgeOptions into #stackra/schemas; replace with STA-339.
/** The shipped `EdgeConfig$`. */
export const EDGE_CONFIG_SCHEMA = z.object({
  keys: z.enum(EDGE_DRIVERS.keys).default("memory"),
  nonces: z.enum(EDGE_DRIVERS.nonces).default("memory"),
  signingKeys: z.string().default(""),
});
