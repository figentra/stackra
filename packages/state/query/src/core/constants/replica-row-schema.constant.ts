/**
 * Stackra file contract:
 * Purpose: `REPLICA_ROW_SCHEMA`, the check of one replica record (`ReplicaRow`): a public id, an ISO 8601 `at` time with
 *          an offset, and JSON data.
 * Boundary: internal; shared by the checks of a refresh's answer and of a stored replica, both untrusted.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0294 (decision 26).
 */
import { json } from "@stackra/validation";
import { z } from "zod";

/** One replica record. */
export const REPLICA_ROW_SCHEMA = z.object({
  id: z.string().min(1),
  at: z.iso.datetime({ offset: true }),
  data: json(),
});
