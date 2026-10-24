/**
 * Stackra file contract:
 * Purpose: `TestConnection<C>`, what `.withConnection(Class, ...)` takes: the connection's fields and, when the test
 *          needs them, its id, level and owner.
 * Boundary: a type only. The owner defaults to a test scope node (or a test user, for a `User` connection), which the
 *           testing module's `ConnectionContext` answers, so `find` reaches the connection.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0308 (rule 9).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";

import type { Connection, ConnectionFields, ConnectionLevel } from "#core/index";

/**
 * A connection put in place by the testing module.
 *
 * @example
 * .withConnection(ResendConnection, { id: "conn_00000000000000000000000001", fields })
 */
export interface TestConnection<C extends Connection> {
  /** The connection's fields, `@Secret` ones included. */
  readonly fields: ConnectionFields<C>;

  /** The connection's id; a fresh one when left out. */
  readonly id?: PublicId<"conn">;

  /** Its level; the Integration's first level when left out. */
  readonly level?: ConnectionLevel;

  /** Its scope node, for a `Scope` connection. */
  readonly scope?: ScopeRef;

  /** Its user, for a `User` connection. */
  readonly userId?: PublicId<"usr">;
}
