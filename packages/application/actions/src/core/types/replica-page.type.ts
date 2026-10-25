/**
 * Stackra file contract:
 * Purpose: `ReplicaPage`, what a replica query answers: the rows changed since the client's cursor and the ids removed
 *          since, or every row (a full fill: the first one, or after a cursor the log no longer holds), with the next
 *          cursor and the "as of" time.
 * Boundary: a type only, the output type of a replica query's `handle` and the wire shape `@stackra/query`'s
 *           `ReplicaChanges` parses (`asOf` and each row's `at` are ISO 8601 on the wire). The cursor is opaque: a
 *           client keeps it and sends it back as the query's `cursor` input, never reads it. `asOf` is the server's
 *           instant of the answer, which every screen reading the replica shows.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: an opaque, monotonic cursor; the first fill is the only full download;
 *                     the "as of" time).
 */
import type { ReplicaRow } from "#contracts/types/replica-row.type";

/**
 * A full fill or the changes since a cursor.
 *
 * @example
 * { rows: [{ id: "sal_3", at, data: { total: 12 } }], removed: ["sal_1"], cursor: "7.sales…", asOf, full: false }
 */
export interface ReplicaPage {
  /** The rows added or changed since the cursor, latest per id, or every row within the bounds when `full`. */
  readonly rows: readonly ReplicaRow[];

  /** The ids of rows removed since the cursor; empty when `full`. */
  readonly removed: readonly string[];

  /** The cursor to send next time. */
  readonly cursor: string;

  /** The server's instant of this answer. */
  readonly asOf: Date;

  /** True when `rows` is the whole replica: replace it instead of merging. */
  readonly full: boolean;
}
