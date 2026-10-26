/**
 * Stackra file contract:
 * Purpose: `ReplicaRow`, one record of a bounded replica as the server hands it: its public id, the instant the
 *          replica's window ages it by, and the record's data.
 * Boundary: a type only. `at` is the server's choice of time for the replica (a sale's time, a customer's last change),
 *           so a client ages rows without knowing field names; it is ISO 8601 on the wire. `data` is JSON, the query's
 *           own row shape, never the database row; a sliced replica's data carries its slice field.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); the client's `ReplicaRow` of @stackra/query is the same wire shape.
 */
import type { Json } from "@stackra/contracts";

/** One replica record. */
export interface ReplicaRow {
  /** The record's public id; a later change of the same record replaces it. */
  readonly id: string;

  /** The instant the replica's window ages the record by. */
  readonly at: Date;

  /** The record's data, in the query's own row shape. */
  readonly data: Json;
}
