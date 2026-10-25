/**
 * Stackra file contract:
 * Purpose: `TransactionArgs`, the part of the ORM's transaction events the outbox writer reads: the entity manager the
 *          transaction (or savepoint) belongs to, which is the one its flushes ran on.
 * Boundary: a structural type, so this package never imports `@mikro-orm/*` (ADR 0097 decision 2); MikroORM's
 *           `TransactionEventArgs` satisfies it.
 * Runtime: node
 * Governing contract: ADR 0097 (decision 2); ADR 0078 (decision 4).
 */

/** What the writer reads of a transaction event. */
export interface TransactionArgs {
  /** The entity manager whose transaction (or savepoint) commits or rolls back, holding it as its context. */
  readonly em: object;
}
