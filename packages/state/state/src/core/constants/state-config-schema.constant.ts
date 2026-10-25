/**
 * Stackra file contract:
 * Purpose: `STATE_CONFIG_SCHEMA`, the zod schema this package ships for `StateConfig` (exported as `StateConfig$`): the
 *          storage area persisted stores write to, whether first render waits for hydration, and devtools in
 *          production.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated `StateConfig$` extends it with
 *           `Base$.shape.<field>.unwrap().default(...)`. The defaults equal `StateOptions`' initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0079; ADR 0256.
 */
import { z } from "zod";

/** The shipped `StateConfig$`. */
export const STATE_CONFIG_SCHEMA = z.object({
  persistStore: z.string().min(1).default("prefs"),
  blockingHydration: z.boolean().default(false),
  devtoolsInProduction: z.boolean().default(false),
});
