/**
 * Stackra file contract:
 * Purpose: `CommentableRef`, the record a thread hangs on: a `Commentable` model's key and the record's public id.
 * Boundary: a type only. Never a foreign key: the record may live in another service, and its table does not change
 *           (the `Commentable` trait of @stackra/model is a marker).
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 1); ADR 0225 (decision 3); ADR 0321 (`Commentable` is collaboration's).
 */

/** A commented record. */
export interface CommentableRef {
  /** The model key (`legal.matter`). */
  readonly model: string;

  /** The record's public id. */
  readonly id: string;
}
