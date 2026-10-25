/**
 * Stackra file contract:
 * Purpose: `REPLICA_CHANGES_SCHEMA`, the check of a server's answer to a replica refresh (`ReplicaChanges`): the
 *          records, the removed ids, the next cursor, the "as of" time and whether the answer is the whole replica.
 * Boundary: internal to `ReplicaStore`; an answer that fails is dropped and the refresh rejects, so the replica keeps
 *           what it holds and its "as of" time.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0294 (decision 26).
 */
import { z } from "zod";

import { REPLICA_ROW_SCHEMA } from "#core/constants/replica-row-schema.constant";

/** A server's answer to a refresh. */
export const REPLICA_CHANGES_SCHEMA = z.object({
  rows: z.array(REPLICA_ROW_SCHEMA),
  removed: z.array(z.string().min(1)),
  cursor: z.string().min(1),
  asOf: z.iso.datetime({ offset: true }),
  full: z.boolean(),
});
