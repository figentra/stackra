/**
 * Stackra file contract:
 * Purpose: `asServiceRole(work)` runs `work` as the guides' service role for the rest of the running transaction, so
 *          the tenant policy holds the test as it holds a deployed service.
 * Boundary: test support only, under `scripts/guides`; `set local role` ends with the transaction `asTenant` opened.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239; ADR 0347 (decision 5); STA-2843.
 */
import { Database } from "@stackra/database";

import { SERVICE_ROLE } from "./service-role";

/**
 * Runs `work` as the service role for the rest of the running transaction.
 *
 * @example
 * await asTenant(acme, () => asServiceRole(() => tickets.waiting()));
 */
export async function asServiceRole<T>(work: () => Promise<T>): Promise<T> {
  // raw-sql: a transaction-local role switch, which a deployed service gets from its connection's user
  await Database.current().em().execute(`set local role ${SERVICE_ROLE}`);
  return work();
}
