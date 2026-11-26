/**
 * Stackra file contract:
 * Purpose: `REPLICA_POSITION_SQL`, the statement `PostgresDatabaseDriver` runs on a replica connection to read how far
 *          it has replayed: whether the server is a standby, whether it has replayed all the WAL it received, and how
 *          long ago (its clock) the newest transaction it replayed committed, in milliseconds.
 * Boundary: read only, no table and no parameter; `replicaPositionOf` reads its row. `pg_last_xact_replay_timestamp`
 *           is the primary's commit time, so the lag assumes the servers' clocks agree (NTP), as Postgres's own lag
 *           views do; a standby that has replayed all it received counts as caught up however old that commit is.
 * Runtime: node
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307, STA-1464).
 */

/** One row: `standby`, `caught_up` and `lag_ms` (null when the standby has replayed no transaction yet). */
export const REPLICA_POSITION_SQL =
  "select pg_is_in_recovery() as standby, " +
  "coalesce(pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn(), false) as caught_up, " +
  "(extract(epoch from clock_timestamp() - pg_last_xact_replay_timestamp()) * 1000)::float8 as lag_ms";
