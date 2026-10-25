/**
 * Stackra file contract:
 * Purpose: `QueryClass`, what `Query({...})` returns: the abstract base a query class extends.
 * Boundary: a type only. Its constructor takes nothing; a subclass declares its dependencies as constructor parameters
 *           and calls `super()`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 25).
 */
import type { QueryBase } from "#core/bases/query.base";

/** The base class of one query. */
export type QueryClass = abstract new () => QueryBase;
