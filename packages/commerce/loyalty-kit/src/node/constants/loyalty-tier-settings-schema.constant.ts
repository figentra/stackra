/**
 * Stackra file contract:
 * Purpose: `LOYALTY_TIER_SETTINGS_SCHEMA`, the zod schema of the tiers section, shared by `LoyaltyTierSettings` and the
 *          `LoyaltyKitSettings` group that nests it.
 * Boundary: internal; the stand-in for what gen writes into `#stackra/schemas` (STA-339). Its defaults equal the section
 *           class's initializers.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26); ADR 0307 (rules 22 to 24).
 */
import { z } from "zod";

/** The tiers section's shape and defaults. */
export const LOYALTY_TIER_SETTINGS_SCHEMA = z.object({
  silverFrom: z.number().int().min(0).default(1000),
  goldFrom: z.number().int().min(0).default(5000),
});
