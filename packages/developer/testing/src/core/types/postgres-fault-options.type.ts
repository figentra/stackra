/**
 * Stackra file contract:
 * Purpose: `PostgresFaultOptions`, which row writes of one table `postgresFault` fails: the fault's name, the table,
 *          the write kinds, how many writes pass first, how many then fail, and the SQLSTATE they fail with.
 * Boundary: a public type of the `.` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0182 (decision 4: fault injection; decision 3: Postgres in the integration tier).
 */
import type { PostgresWrite } from "#core/types/postgres-write.type";

/** Which row writes of a table fail, and how. */
export interface PostgresFaultOptions {
  /** The fault's name, a snake_case identifier unique in the table's schema (it names the trigger and its parts). */
  readonly name: string;
  /** The schema-qualified table, snake_case: `queue.jobs`. */
  readonly table: string;
  /** The writes that fail: one kind or several. */
  readonly on: PostgresWrite | readonly PostgresWrite[];
  /** How many row writes pass before the first fails. Default 0. */
  readonly skip?: number;
  /** How many row writes then fail; later ones pass. Default 1. */
  readonly times?: number;
  /** The SQLSTATE a failed write raises. Default `08006` (connection_failure: the database went away). */
  readonly sqlstate?: string;
}
