/**
 * Stackra file contract:
 * Purpose: `LOYALTY_KIT_CONFIG_SCHEMA`, the zod schema this package ships for `LoyaltyKitConfig` (exported as
 *          `LoyaltyKitConfig$`): the ledger driver and the named ledgers. The earn rate, point value and redemption cap
 *          are settings (`LoyaltyKitSettings`, ADR 0454, STA-1323), not config.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults and a host's generated schema can `.extend` it; the defaults equal `LoyaltyKitOptions`'
 *           initializers (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0454 (decision 2).
 */
import { z } from "zod";

import { LOYALTY_LEDGER_DRIVERS } from "#core/constants/loyalty-ledger-drivers.constant";

/** The shipped `LoyaltyKitConfig$`. */
export const LOYALTY_KIT_CONFIG_SCHEMA = z.object({
  ledger: z.enum(LOYALTY_LEDGER_DRIVERS).default("postgres"),
  ledgers: z.record(z.string(), z.enum(LOYALTY_LEDGER_DRIVERS)).default({}),
});
