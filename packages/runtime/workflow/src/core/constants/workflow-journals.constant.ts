/**
 * Stackra file contract:
 * Purpose: `WORKFLOW_JOURNALS`, the `WorkflowJournal` drivers this package ships, by name (the file prefix of each
 *          driver): `postgres`, the durable default, and `memory`.
 * Boundary: internal; the config schema and the `DriverRegistry` entry read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0292 (decision 2: the Postgres journal is the default); ADR 0294 (decision 4: a driver
 *                     choice is typed `DriverName<Port>`).
 */

/** The journal drivers, by name. */
export const WORKFLOW_JOURNALS = ["postgres", "memory"] as const;
