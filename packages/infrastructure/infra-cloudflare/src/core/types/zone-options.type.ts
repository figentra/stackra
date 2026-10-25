/**
 * Stackra file contract:
 * Purpose: `ZoneOptions`, one zone's entry of the core stack config (defaults applied): plan, edge, SaaS fallback
 *          origin, records and Worker custom domains.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6), ADR 0290 (decisions 3, 13 and 15), ADR 0284 (decision 9).
 */
import type { z } from "zod";

import type { ZONE_OPTIONS_SCHEMA } from "#core/constants/zone-options-schema.constant";

/** One zone's options. */
export type ZoneOptions = z.output<typeof ZONE_OPTIONS_SCHEMA>;
