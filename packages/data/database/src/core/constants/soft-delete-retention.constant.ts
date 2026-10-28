/**
 * Stackra file contract:
 * Purpose: `SOFT_DELETE_RETENTION`, how long a soft-deleted row is kept before the `record.prune` job deletes it for
 *          good: 30 days (ADR 0189 decision 4).
 * Boundary: internal; read by `pruneRecords` for every `SoftDeletes` model. A legal hold still keeps a row past it.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 4: retention defaults); ADR 0134 (decision 4: the soft delete policy).
 */
import { Duration } from "@stackra/contracts";

/** The soft-delete window. */
export const SOFT_DELETE_RETENTION = Duration.days(30);
