/**
 * Stackra file contract:
 * Purpose: `SESSION_TIMEOUTS_SCHEMA`, the zod schema of the `timeouts` field of `DatabaseConfig`: the statement, lock
 *          and idle-in-transaction timeouts every runtime database session starts with.
 * Boundary: an internal part of this package's shipped config schema, not exported. Every field has a default (the
 *           platform floor), so `.parse({})` gives the defaults the options class initializes (tested); runway's
 *           `config.database` layer sets them per environment. The migration runner keeps its own session timeouts
 *           (ADR 0159 decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); data-layer gap sc5 (stackra-253).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

import { CANONICAL_DURATION_SCHEMA } from "#core/constants/canonical-duration-schema.constant";

/** The platform floors: 30 s per statement, 10 s waiting for a lock, 60 s idle inside a transaction. */
export const SESSION_TIMEOUTS_SCHEMA = z
  .object({
    statement: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(30)),
    lock: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(10)),
    idleInTransaction: CANONICAL_DURATION_SCHEMA.default(Duration.seconds(60)),
  })
  .default(() => ({
    statement: Duration.seconds(30),
    lock: Duration.seconds(10),
    idleInTransaction: Duration.seconds(60),
  }));
