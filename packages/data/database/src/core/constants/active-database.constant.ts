/**
 * Stackra file contract:
 * Purpose: `ACTIVE_DATABASE`, the connected database of this process, which `Database.current()` returns to the
 *          classes that cannot inject it (`CrudService` subclasses call `super()` with no arguments, factories are
 *          built with `new`).
 * Boundary: internal; written only by a driver's `connect` and `close`. One database per process.
 *           shortcut: one connection for every module; when runway topology moves a module to its own database,
 *           key this by module.
 * Runtime: node
 * Governing contract: ADR 0238 (one logical database per service); ADR 0014 (decision 5).
 */
import type { Database } from "#core/ports/database.port";

/** The connected database, or undefined before `connect` and after `close`. */
export const ACTIVE_DATABASE: { current: Database | undefined } = { current: undefined };
