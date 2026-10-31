/**
 * Stackra file contract:
 * Purpose: `IdempotencyStoreNotTransactionalError` (`idempotency_store_not_transactional`), the refusal of a call with
 *          an Idempotency-Key that joined a transaction already running when the bound `IdempotencyStore` cannot join
 *          it (Valkey, memory).
 * Boundary: thrown by the pipeline's idempotency step before anything is claimed or run, so no key is held and no
 *           work is done. A deployment error, not the caller's (500): such a store would mark the key done before the
 *           outer transaction commits, and a failed commit would then replay a success that never committed. Bind
 *           the Postgres store (`config.actions.stores.idempotency: postgres`) where calls join outer transactions.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (note of 2026-11-01); ADR 0136 (decision 3); ADR 0140.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The call joined a running transaction and the idempotency store cannot join it. */
export class IdempotencyStoreNotTransactionalError extends Refusal({
  kind: ErrorKind.Internal,
  retryable: false,
}) {}
