/**
 * Stackra file contract:
 * Purpose: `readTreeAtRoot(database, at, read)`, how tenancy reads the scope tree whatever session the caller holds:
 *          `read` runs in a scope session over the root label of `at`'s path, which grants the whole tree for that one
 *          read, because the tree's row security shows a session only its own subtree (it hides a branch's tenant
 *          ancestor from the branch's own session) and shows nothing outside every scope session.
 * Boundary: over the `Database` port only: `read` reads the scope tree through its port and nothing tenant-owned.
 *           The session is a savepoint (a transaction of its own outside one) rolled back once `read`
 *           has answered, so the root-label settings never outlive it: inside a running transaction a released
 *           savepoint would keep them until the outer transaction ends. A read that fails throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2 and the note of 2026-11-01); ADR 0327 (decisions 3 and 8).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";

/** Thrown inside the tree read to roll its savepoint back; never leaves `readTreeAtRoot`. */
const ROLL_BACK = Symbol("roll back the tree read");

/**
 * What `read` answers, read in a scope session over the root label of `at`'s path.
 *
 * @example
 * const tenant = await readTreeAtRoot(database, scope, () => tenantOf(tree, scope));
 * @throws the error `read` throws, or the session's own.
 */
export async function readTreeAtRoot<T>(
  database: Database,
  at: ScopeRef,
  read: () => Promise<T>,
): Promise<T> {
  const root = { id: at.id, path: at.path.split(".")[0] ?? at.path };
  let answer: { readonly value: T } | undefined;
  try {
    await database.withScope(root, async () => {
      answer = { value: await read() };
      throw ROLL_BACK;
    });
  } catch (error) {
    if (answer === undefined) throw error;
  }
  if (answer === undefined) throw new Error("the scope tree read did not run");
  return answer.value;
}
