/**
 * Stackra file contract:
 * Purpose: `PGAUDIT_CLASSES`, the pgaudit statement classes a runway may name in `shared.database.pgaudit.log`.
 * Boundary: internal; read by the runway schema and `PGAUDIT_DEFAULTS`. `all` and `none` are left out: a runway names
 *           the classes it audits.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decision 5: pgaudit records direct database sessions).
 */

/** The pgaudit statement classes. */
export const PGAUDIT_CLASSES = [
  "read",
  "write",
  "function",
  "role",
  "ddl",
  "misc",
  "misc_set",
] as const;
