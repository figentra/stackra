/**
 * Stackra file contract:
 * Purpose: `QUERY_GUARD_SCHEMA`, the zod schema of the `queries` field of `DatabaseConfig`: the slow-statement
 *          threshold, the repeat limit of one statement shape per call, and the strict switch.
 * Boundary: an internal part of this package's shipped config schema, not exported. Every field has a default (half a
 *           second, ten repeats, not strict), so `.parse({})` gives the defaults the options class initializes (tested).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); data-layer gaps scale-performance 7 and 8 (stackra-282, STA-1400).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { CANONICAL_DURATION_SCHEMA } from "#core/constants/canonical-duration-schema.constant";

/** Half a second, ten repeats, warnings only. */
export const QUERY_GUARD_SCHEMA = z
  .object({
    slow: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(0.5)),
    repeats: z.int().min(1).default(10),
    strict: z.boolean().default(false),
  })
  .default(() => ({ slow: Duration.seconds(0.5), repeats: 10, strict: false }));
