/**
 * Stackra file contract:
 * Purpose: `MARKET_PACKS_CONFIG_SCHEMA`, the zod schema this package ships for `MarketPacksConfig` (exported as
 *          `MarketPacksConfig$`): the resolved-pack source driver, the content hashes of the packs the deployment
 *          serves and the public keys it accepts pack signatures from.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; the defaults equal `MarketPacksOptions`' initializers (tested). Hashes are 64 lowercase hex;
 *           keys are public, never secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0370 (decision 2: trusted keys are deployment configuration); ADR 0294 (decision
 *                     26: a package ships its own `X$`).
 */
import { z } from "zod";

import { RESOLVED_PACK_SOURCE_DRIVERS } from "#core/constants/resolved-pack-source-drivers.constant";

/** The shipped `MarketPacksConfig$`. */
export const MARKET_PACKS_CONFIG_SCHEMA = z.object({
  source: z.enum(RESOLVED_PACK_SOURCE_DRIVERS).default("store"),
  packHashes: z
    .array(z.string().regex(/^[0-9a-f]{64}$/, "Expected a 64-hex content hash"))
    .default([]),
  trustedKeys: z.record(z.string().min(1), z.string().min(1)).default({}),
});
