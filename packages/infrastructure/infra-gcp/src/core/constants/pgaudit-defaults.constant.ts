/**
 * Stackra file contract:
 * Purpose: `PGAUDIT_DEFAULTS`, what a Cloud SQL server audits when the runway does not say: DDL and role changes, kept
 *          400 days in a log bucket in the server's region.
 * Boundary: internal; read by `gcpRuntimeConfig` for the keys the runway leaves out. `write` is not a default: set
 *           server-wide it logs every write the app makes, so writes of the roles people sign in with are audited per
 *           role (`alter role ... set pgaudit.log`) inside the database instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 5: pgaudit; decision 6: thirteen months hot), ADR 0227 (pgaudit in place of a
 *                     CDC tool).
 */
import type { PGAUDIT_CLASSES } from "#core/constants/pgaudit-classes.constant";

/** The audit of a server whose runway says nothing: DDL and role changes, kept 400 days (about thirteen months). */
export const PGAUDIT_DEFAULTS: {
  readonly log: readonly (typeof PGAUDIT_CLASSES)[number][];
  readonly retentionDays: number;
} = { log: ["ddl", "role"], retentionDays: 400 };
