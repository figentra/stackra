/**
 * Stackra file contract:
 * Purpose: `PERSISTED_REPLICA_SCHEMA`, the stored form of one replica in the sealed `cache` area: a schema version, the
 *          cursor of its last refresh, its "as of" time and its records.
 * Boundary: internal to `ReplicaStore`; what fails is dropped and the replica refills with a full download, because a
 *           replica is disposable. Versioned (`version: 1`).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 2 and 3); ADR 0294 (decision 26).
 */
import { z } from "zod";

import { REPLICA_ROW_SCHEMA } from "#core/constants/replica-row-schema.constant";

/** One stored replica. */
export const PERSISTED_REPLICA_SCHEMA = z.object({
  version: z.literal(1),
  cursor: z.string().min(1),
  asOf: z.iso.datetime({ offset: true }),
  rows: z.array(REPLICA_ROW_SCHEMA),
});
