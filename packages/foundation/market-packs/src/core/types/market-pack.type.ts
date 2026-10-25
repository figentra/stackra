/**
 * Stackra file contract:
 * Purpose: `MarketPack`, one version of one market's pack (or of one product's section of it), as `verifyPack` returns
 *          it after the hash and signature checks.
 * Boundary: a type only, the output of `MarketPack$`, so the type and the check never disagree. Pack content is data
 *           owned by the platform (base packs) and by each product (its section); this package ships none.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 1); ADR 0363 (decision 3).
 */
import type { z } from "zod";

import type { MARKET_PACK_SCHEMA } from "#core/constants/market-pack-schema.constant";

/** One pack version. */
export type MarketPack = z.output<typeof MARKET_PACK_SCHEMA>;
