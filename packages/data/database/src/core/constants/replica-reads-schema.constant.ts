/**
 * Stackra file contract:
 * Purpose: `REPLICA_READS_SCHEMA`, the zod schema of the `replicaReads` field of `DatabaseConfig`: the default
 *          `maxLag` of a replica query (five seconds), how long a lag reading is reused (`probeEvery`, one second), and
 *          the per-query and per-area overrides of where a query reads (none).
 * Boundary: an internal part of this package's shipped config schema, not exported. Every field has a default, so
 *           `.parse({})` gives the defaults the options class initializes (tested). An area outside `ApiArea`, or a
 *           place other than `primary` or `replica`, is a config issue.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0057 (decision 6: read replica); data-layer gap scale-performance
 *                     11 (stackra-307, STA-1464).
 */
import { ApiArea, Duration, Enum } from "@stackra/contracts";
import { z } from "zod";

import { CANONICAL_DURATION_SCHEMA } from "#core/constants/canonical-duration-schema.constant";

/** Where a query reads. */
const PLACE = z.enum(["primary", "replica"]);

/** The API areas, as a zod enum. */
const AREA = z.enum(Enum.values(ApiArea) as [ApiArea, ...ApiArea[]]);

/** Five seconds of lag, a reading reused for a second, no overrides. */
export const REPLICA_READS_SCHEMA = z
  .object({
    maxLag: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(5)),
    probeEvery: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(1)),
    queries: z.record(z.string().min(1), PLACE).default(() => ({})),
    areas: z.partialRecord(AREA, PLACE).default(() => ({})),
  })
  .default(() => ({
    maxLag: Duration.seconds(5),
    probeEvery: Duration.seconds(1),
    queries: {},
    areas: {},
  }));
