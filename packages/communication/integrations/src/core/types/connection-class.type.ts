/**
 * Stackra file contract:
 * Purpose: `ConnectionClass<C>`, a concrete connection class as a store or a test names it (`find(ResendConnection)`).
 * Boundary: a type only. A connection is a record the store loads, never injected, so its constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 2).
 */
import type { Connection } from "#core/bases/connection.base";

/** A connection class. */
export type ConnectionClass<C extends Connection = Connection> = new () => C;
