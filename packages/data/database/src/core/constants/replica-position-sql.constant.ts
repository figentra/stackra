/**
 * Stackra file contract:
 * Purpose: `REPLICA_POSITION_SQL`, the statement `PostgresDatabaseDriver` runs on a replica connection to read how far
 *          it has replayed: whether the server is a standby, whether it has replayed through the primary position the
 *          driver read just before (its one parameter, from `PRIMARY_POSITION_SQL`), and how long ago (its clock) the
 *          newest transaction it replayed committed, in milliseconds.
 * Boundary: read only, no table, no privilege beyond connecting; `replicaPositionOf` reads its row. `caught_up` compares
 *           the replica with the primary, never with the WAL the replica itself received: a standby whose WAL receiver
 *           stopped (network partition, receiver crash, slot or auth error, a failover that left it behind) keeps its
 *           last received position, replays up to it and would look caught up forever. A null parameter (the primary
 *           did not answer) makes `caught_up` false, so the lag alone decides, and that lag grows while nothing new is
 *           replayed. `pg_last_xact_replay_timestamp` is the primary's commit time, so the lag assumes the servers'
 *           clocks agree (NTP), as Postgres's own lag views do.
 * Runtime: node
 * Governing contract: ADR 0057 (decision 6: read replica); data-layer gap scale-performance 11 (stackra-307, STA-1464).
 */

/**
 * One row: `standby`, `caught_up` (replayed through the given primary position) and `lag_ms` (null when the standby
 * has replayed no transaction yet). Its one parameter is the primary's position as text, or null.
 */
export const REPLICA_POSITION_SQL =
  "select pg_is_in_recovery() as standby, " +
  "coalesce(pg_last_wal_replay_lsn() >= ?::pg_lsn, false) as caught_up, " +
  "(extract(epoch from clock_timestamp() - pg_last_xact_replay_timestamp()) * 1000)::float8 as lag_ms";
