/**
 * Stackra file contract:
 * Purpose: `ReplicaRow`, one record of a bounded replica as the server hands it: its public id, the time the replica's
 *          window measures, and the record itself.
 * Boundary: a type only, JSON-safe, because the replica is kept in the sealed `cache` area. `at` is the server's choice
 *           of time for the replica (a sale's time, a customer's last change), so the client ages rows without knowing
 *           field names. A scoped replica's `data` carries its scope field, which the client checks.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0135 (public ids); ADR 0294 (decision 8).
 */
import type { Json } from "@stackra/contracts";

/**
 * A replica's record.
 *
 * @example
 * { id: "sal_01J9Z3K4M5N6P7Q8R9S0T1V2W3", at: "2026-10-24T09:00:00.000Z", data: { legalEntityId: "len_1", total: 12 } }
 */
export interface ReplicaRow {
  /** The record's public id; a later change of the same record replaces it. */
  readonly id: string;

  /** The time the replica's window ages the record by (ISO 8601). */
  readonly at: string;

  /** The record itself, as JSON. */
  readonly data: Json;
}
