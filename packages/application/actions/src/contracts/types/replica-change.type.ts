/**
 * Stackra file contract:
 * Purpose: `ReplicaChange`, one entry of a replica's change log: a record's id and its new row, or no row when the
 *          record left the replica (deleted, or moved out of its slice).
 * Boundary: a type only, what a producer records and `ReplicaLog` keeps in order. A reader collapses the entries since
 *           a cursor to the latest per id: the rows still present and the ids removed.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: incremental refresh by change cursor).
 */
import type { ReplicaRow } from "#contracts/types/replica-row.type";

/** One change to a replica. */
export interface ReplicaChange {
  /** The record's public id. */
  readonly id: string;

  /** The record's row now; absent when the record left the replica. */
  readonly row?: ReplicaRow;
}
