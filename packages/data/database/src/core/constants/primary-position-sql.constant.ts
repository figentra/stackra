/**
 * Stackra file contract:
 * Purpose: `PRIMARY_POSITION_SQL`, the statement `PostgresDatabaseDriver` runs on the primary just before it reads a
 *          replica's position: the primary's WAL insert position, which holds every transaction committed before the
 *          statement ran.
 * Boundary: read only, no table and no parameter, no privilege beyond connecting; the driver passes the `lsn` text to
 *           `REPLICA_POSITION_SQL`. The insert position (not the flushed one) also covers an asynchronous commit
 *           (`synchronous_commit = off`) that returned before its WAL was flushed.
 * Runtime: node
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307, STA-1464).
 */

/** One row: `lsn`, the primary's WAL insert position as text (`0/5018E40`). */
export const PRIMARY_POSITION_SQL = "select pg_current_wal_insert_lsn()::text as lsn";
