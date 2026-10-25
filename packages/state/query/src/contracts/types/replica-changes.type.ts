/**
 * Stackra file contract:
 * Purpose: `ReplicaChanges`, one answer of a replica query: the records changed since the cursor the client sent (or
 *          every record, for the first fill or a cursor the server no longer honours), the ids removed since, the next
 *          opaque cursor, and the time the answer is true as of.
 * Boundary: a type only, the wire contract of a `replica:` query (ADR 0338 decision 3) that the server side and gen
 *           serve. The cursor is opaque and monotonic: the client stores it and sends it back, never reads it. `full`
 *           tells the client to replace what it holds instead of merging.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0294 (decision 8).
 */
import type { ReplicaRow } from "#contracts/types/replica-row.type";

/**
 * The changes of a replica since a cursor.
 *
 * @example
 * { rows: [row], removed: ["sal_2"], cursor: "c_19", asOf: "2026-10-24T09:00:00.000Z", full: false }
 */
export interface ReplicaChanges {
  /** The records added or changed since the cursor, or every record when `full`. */
  readonly rows: readonly ReplicaRow[];

  /** The ids of records removed since the cursor; empty when `full`. */
  readonly removed: readonly string[];

  /** The cursor to send with the next refresh. */
  readonly cursor: string;

  /** When the answer was true (ISO 8601); every screen that reads the replica shows it. */
  readonly asOf: string;

  /** True when `rows` is the whole replica: the first fill, or a cursor the server no longer honours. */
  readonly full: boolean;
}
