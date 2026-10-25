/**
 * Stackra file contract:
 * Purpose: `ReplicaPage`, what a replica query answers: a full fill (the first one, or after a cursor the log no longer
 *          holds) or the changes since the client's cursor, with the next cursor and the "as of" time.
 * Boundary: a type only, the output type of a replica query's `handle`. The cursor is opaque: a client keeps it and
 *           sends it back in `Stackra-Replica-Cursor`, never reads it. `asOf` is the server's instant of the answer,
 *           which every screen reading the replica shows.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: an opaque, monotonic cursor; the first fill is the only full download;
 *                     the "as of" time).
 */
import type { ReplicaChange } from "#contracts/types/replica-change.type";

/** A full fill or the changes since a cursor. */
export type ReplicaPage<R> =
  | {
      /** A full fill: replace the replica with `rows`. */
      readonly full: true;
      /** Every row within the window, at most the limit. */
      readonly rows: readonly R[];
      /** The cursor to send next time. */
      readonly cursor: string;
      /** The server's instant of this answer. */
      readonly asOf: Date;
    }
  | {
      /** An incremental page: apply `changes` in order. */
      readonly full: false;
      /** The changes since the cursor sent, oldest first. */
      readonly changes: readonly ReplicaChange<R>[];
      /** Whether more changes wait: ask again with `cursor` at once. */
      readonly more: boolean;
      /** The cursor to send next time. */
      readonly cursor: string;
      /** The server's instant of this answer. */
      readonly asOf: Date;
    };
