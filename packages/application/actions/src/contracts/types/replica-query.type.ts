/**
 * Stackra file contract:
 * Purpose: `ReplicaQuery`, what the pipeline tells `ReplicaReads` about a query before it routes the read: its key, the
 *          API area it arrived on, where its code says it reads (`reads`, `"primary"` when absent) and the replica lag
 *          its code says it tolerates (`maxLag`), so configuration can move it per query or per area and the driver can
 *          keep a lagging replica away from it.
 * Boundary: a type only; the pipeline builds it from the querys options and the calls descriptor. It carries no input,
 *           no caller and no record.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307,
 *                     STA-1464: replica reads by declaration, set by configuration, with a lag guard).
 */
import type { ApiArea, Duration } from "@stackra/contracts";

/** A query about to read. */
export interface ReplicaQuery {
  /** The query key (`visit.list`). */
  readonly key: string;

  /** The API area the call arrived on. */
  readonly area: ApiArea;

  /** Where the query's code says it reads: its `reads` option, `"primary"` when absent. */
  readonly declared: "primary" | "replica";

  /** The most replica lag the query's code tolerates (its `maxLag` option); the driver's default when absent. */
  readonly maxLag?: Duration;
}
