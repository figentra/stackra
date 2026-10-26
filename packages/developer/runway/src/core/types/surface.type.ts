/**
 * Stackra file contract:
 * Purpose: `Surface`, one `surfaces.<surface>` entry of the root runway: shell line, packages, landing content, host,
 *          ops contribution and the product's own app member.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 3), ADR 0436.
 */
import type { z } from "zod";

import type { SURFACE_SCHEMA } from "#core/constants/surface-schema.constant";

/** One surface a product contributes to. */
export type Surface = z.output<typeof SURFACE_SCHEMA>;
