/**
 * Stackra file contract:
 * Purpose: `CONNECTION_GATES`, the `ConnectionGate` of each connected Postgres database, keyed by its MikroORM driver,
 *          which every fork of its entity manager shares, so `holdConnection` finds the gate from any entity manager.
 * Boundary: internal; written only by `PostgresDatabaseDriver.connect` and `close`. A database with no gate (the
 *           memory driver's single PGlite connection) runs its transactions as they come.
 * Runtime: node
 * Governing contract: ADR 0473 (the 2026-11-26 note: the gate); STA-1716.
 */
import type { ConnectionGate } from "#core/values/connection-gate.value";

/** The gate of each connected database, by its ORM driver. */
export const CONNECTION_GATES = new WeakMap<object, ConnectionGate>();
