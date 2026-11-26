/**
 * Stackra file contract:
 * Purpose: `DATABASE_POOL_SCHEMA`, the zod schema of the `pool` field of `DatabaseConfig`: the pool size of one
 *          instance (`max`, `min`), how long an idle connection stays open, and the connection gate's optional
 *          `acquireTimeout` (how long a transaction waits for its place) and `nesting` (how deep a chain it keeps
 *          places for).
 * Boundary: an internal part of this package's shipped config schema, not exported. `max`, `min` and `idleTimeout`
 *           have a default (the `pg` pool's own: ten connections, none kept, ten seconds idle), so `.parse({})` gives
 *           the defaults the options class initializes (tested); the gate's two are left out unless set, and the
 *           driver then uses `POOL_GATE_DEFAULTS`. `min` above `max` is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0473 (decision 2 and the 2026-11-26 note: the gate); STA-1716.
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { CANONICAL_DURATION_SCHEMA } from "#core/constants/canonical-duration-schema.constant";

/** The `pg` pool's defaults: ten connections, none kept open, ten seconds idle. */
export const DATABASE_POOL_SCHEMA = z
  .object({
    max: z.int().min(1).default(10),
    min: z.int().min(0).default(0),
    idleTimeout: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(10)),
    acquireTimeout: CANONICAL_DURATION_SCHEMA.optional(),
    nesting: z.int().min(1).optional(),
  })
  .refine((pool) => pool.min <= pool.max, { message: "`min` is above `max`", path: ["min"] })
  .default(() => ({ max: 10, min: 0, idleTimeout: Duration.seconds(10) }));
