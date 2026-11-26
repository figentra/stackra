/**
 * Stackra file contract:
 * Purpose: `holdConnection(em, work, requiresNew)`, how a transaction that takes a connection of its own (a top-level
 *          one, or a `requiresNew` one) waits for its place in its database's `ConnectionGate` before it opens.
 * Boundary: internal to the transaction paths of this package (`runTransaction`, `CrudService`'s own-transaction
 *           writes). A savepoint inside a running transaction takes no connection and runs at once, as does every
 *           transaction of a database with no gate.
 * Runtime: node
 * Governing contract: ADR 0473 (the 2026-11-26 note: the gate); ADR 0136 (decision 2); STA-1716.
 */
import type { EntityManager } from "@mikro-orm/postgresql";

import { CONNECTION_GATES } from "#core/constants/connection-gates.constant";

/**
 * Runs `work`, which opens a transaction on `em`, once the gate admits it.
 *
 * @throws RangeError when the chain would hold more connections than the pool has (`ConnectionGate.hold`).
 * @throws ConnectionPoolExhaustedError when no place came free within the pool's `acquireTimeout`.
 * @example
 * return holdConnection(em, () => em.transactional(run), true);
 */
export function holdConnection<T>(
  em: EntityManager,
  work: () => Promise<T>,
  requiresNew = false,
): Promise<T> {
  const gate = CONNECTION_GATES.get(em.getDriver());
  if (gate === undefined || (!requiresNew && em.isInTransaction())) return work();
  return gate.hold(work);
}
