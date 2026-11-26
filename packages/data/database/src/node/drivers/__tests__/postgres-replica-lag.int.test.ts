/**
 * Stackra file contract:
 * Purpose: integration tests of the lag guard of `PostgresDatabaseDriver.onReplica` on a real streaming standby: a
 *          caught-up standby serves a read that demands two seconds; once its replay is paused behind a write, a read
 *          demanding `maxLag: 1s`, or replayed through the caller's write (`after`), runs on the primary and sees the
 *          write, while an unguarded or tolerant read still reads the stale standby; `DatabaseReplicaReadsDriver` sends
 *          a pipeline visit to the primary the same way; and once replay resumes the standby serves the guarded reads
 *          again. A role with no privilege beyond connecting measures the standby the same way. Once the standby's WAL
 *          receiver is cut (it has replayed all it received, so its own positions still agree), a guarded read runs on
 *          the primary and sees the write the standby never received.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. One network holds the primary (the test image
 *           with replication allowed) and a standby made from it with `pg_basebackup -R`; replay is paused and resumed
 *           with `pg_wal_replay_pause()` / `pg_wal_replay_resume()` on the standby, and the receiver is cut by pointing
 *           the standby's `primary_conninfo` at a host that does not resolve (the last case, as it leaves the standby
 *           cut). The credentials are the test container's throwaway defaults and a random password per run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0182 (test tiers); ADR 0269; data-layer gap
 *                     scale-performance 11 (stackra-307, STA-1464: the lag guard).
 */
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { buildConfig } from "@stackra/config";
import { ApiArea, Duration } from "@stackra/contracts";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import type * as PostgresContainers from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type * as Testcontainers from "testcontainers";
import type { StartedNetwork, StartedTestContainer } from "testcontainers";

import { DatabaseConfig } from "#config/database.config";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { REPLICA_POSITION_SQL } from "#core/constants/replica-position-sql.constant";
import { DatabaseReplicaReadsDriver } from "#node/drivers/database-replica-reads.driver";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
import { buildPostgresTestImage } from "#testing/functions/build-postgres-test-image.function";
import { requireTestPeer } from "#testing/functions/require-test-peer.function";

/** How long building, pulling and starting both servers may take. */
const BOOT_TIMEOUT_MS = 300_000;

/** The standby's data directory, made by `pg_basebackup`. */
const STANDBY_DATA = "/tmp/standby";

const state: {
  network?: StartedNetwork;
  primary?: StartedPostgreSqlContainer;
  standby?: StartedTestContainer;
  database?: PostgresDatabaseDriver;
} = {};

/** `value`, or a failure naming what is missing. */
function ready<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`${name} did not start`);
  return value;
}

/** Runs `sql` on the standby through its local socket and returns the first column of the first row. */
async function onStandby(sql: string): Promise<string> {
  const result = await ready(state.standby, "standby").exec([
    "gosu",
    "postgres",
    "psql",
    "-U",
    "test",
    "-d",
    "test",
    "-At",
    "-c",
    sql,
  ]);
  if (result.exitCode !== 0) throw new Error(`standby refused ${sql}: ${result.output}`);
  return result.output.trim();
}

/** Waits until `check` holds, for at most 30 seconds. */
async function until(check: () => Promise<boolean>, what: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (!(await check())) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await sleep(100);
  }
}

/** Whether the work ran on a standby. */
async function onAStandby(): Promise<boolean> {
  const rows = await ready(state.database, "database")
    .em()
    .execute("select pg_is_in_recovery() as standby");
  return rows[0]?.["standby"] === true;
}

/** How many rows the server the work ran on holds. */
async function rowCount(): Promise<number> {
  const rows = await ready(state.database, "database")
    .em()
    .execute("select count(*)::int as n from public.lag_probe");
  return Number(rows[0]?.["n"]);
}

beforeAll(async () => {
  const { GenericContainer, Network, Wait } =
    requireTestPeer<typeof Testcontainers>("testcontainers");
  const { PostgreSqlContainer } = requireTestPeer<typeof PostgresContainers>(
    "@testcontainers/postgresql",
  );
  const image = await buildPostgresTestImage();
  state.network = await new Network().start();
  state.primary = await new PostgreSqlContainer(image)
    .withNetwork(state.network)
    .withNetworkAliases("primary")
    .start();
  const allowed = await state.primary.exec([
    "bash",
    "-c",
    'echo "host replication all all scram-sha-256" >> "$(gosu postgres psql -U test -d test -At -c "show hba_file")" && gosu postgres psql -U test -d test -c "select pg_reload_conf()"',
  ]);
  if (allowed.exitCode !== 0) throw new Error(`primary refused replication: ${allowed.output}`);
  state.standby = await new GenericContainer(image)
    .withNetwork(state.network)
    .withEnvironment({ PGPASSWORD: state.primary.getPassword() })
    .withEntrypoint(["bash", "-c"])
    .withCommand([
      [
        "set -e",
        `install -d -o postgres -g postgres -m 700 ${STANDBY_DATA}`,
        `gosu postgres pg_basebackup -h primary -U ${state.primary.getUsername()} -D ${STANDBY_DATA} -R -X stream`,
        `exec gosu postgres postgres -D ${STANDBY_DATA}`,
      ].join(" && "),
    ])
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/ready to accept read-only connections/))
    .withStartupTimeout(BOOT_TIMEOUT_MS)
    .start();
  const standbyUrl = `postgresql://${state.primary.getUsername()}:${state.primary.getPassword()}@${state.standby.getHost()}:${state.standby.getMappedPort(5432)}/${state.primary.getDatabase()}`;
  state.database = await PostgresDatabaseDriver.connect({
    url: state.primary.getConnectionUri(),
    replicas: [standbyUrl],
    replicaProbe: Duration.seconds(0.05),
    entities: [],
  });
  await state.database.em().execute("create table public.lag_probe (id int primary key)");
  await state.database.em().execute("insert into public.lag_probe values (1)");
  await until(
    async () => (await onStandby("select count(*) from public.lag_probe")) === "1",
    "the standby to replay the first row",
  );
}, BOOT_TIMEOUT_MS);

afterAll(async () => {
  await state.database?.close();
  await state.standby?.stop();
  await state.primary?.stop();
  await state.network?.stop();
});

describe("PostgresDatabaseDriver lag guard on a streaming standby (STA-1464)", () => {
  it("reads a fresh standby, skips one lagging past maxLag or behind the caller's write, and reads it again once caught up", async () => {
    const database = ready(state.database, "database");
    const strict = { maxLag: Duration.seconds(1) };

    expect(await database.onReplica(onAStandby, { maxLag: Duration.seconds(2) })).toBe(true);

    await onStandby("select pg_wal_replay_pause()");
    await database.em().execute("insert into public.lag_probe values (2)");
    const wroteAt = new Date();
    await until(
      async () =>
        (await onStandby("select pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()")) === "f",
      "the standby to receive the write it does not replay",
    );
    await sleep(1500);

    // The guarded reads run on the primary and see the write.
    expect(await database.onReplica(onAStandby, strict)).toBe(false);
    expect(await database.onReplica(rowCount, strict)).toBe(2);
    expect(
      await database.onReplica(onAStandby, { maxLag: Duration.seconds(3600), after: wroteAt }),
    ).toBe(false);
    // An unguarded or tolerant read still reads the stale standby.
    expect(await database.onReplica(onAStandby)).toBe(true);
    expect(await database.onReplica(rowCount)).toBe(1);
    expect(await database.onReplica(rowCount, { maxLag: Duration.seconds(3600) })).toBe(1);

    // The pipeline's driver demands the query's maxLag, else the configured one.
    const previous = ACTIVE_DATABASE.current;
    ACTIVE_DATABASE.current = database;
    try {
      const reads = new DatabaseReplicaReadsDriver(
        buildConfig(DatabaseConfig, {
          values: {
            replicaReads: {
              maxLag: Duration.seconds(1),
              probeEvery: Duration.seconds(0.05),
              queries: {},
              areas: {},
            },
          },
        }),
      );
      const visit = {
        key: "lag.probe",
        area: ApiArea.App,
        declared: "replica" as const,
        writer: "-:usr_1",
        at: new Date(),
      };
      expect(await reads.onReplica(rowCount, visit)).toBe(2);
      expect(await reads.onReplica(rowCount, { ...visit, maxLag: Duration.seconds(3600) })).toBe(1);
    } finally {
      ACTIVE_DATABASE.current = previous;
    }

    await onStandby("select pg_wal_replay_resume()");
    await until(
      async () => (await onStandby("select count(*) from public.lag_probe")) === "2",
      "the standby to replay the second row",
    );
    await sleep(100);
    expect(await database.onReplica(onAStandby, { ...strict, after: wroteAt })).toBe(true);
    expect(await database.onReplica(rowCount, { ...strict, after: wroteAt })).toBe(2);
  });

  it("measures the standby as a role with no privilege beyond connecting", async () => {
    const database = ready(state.database, "database");
    const primary = ready(state.primary, "primary");
    const standby = ready(state.standby, "standby");
    const password = randomUUID();
    await database.em().execute(`create role lag_reader login password '${password}'`);
    await until(
      async () =>
        (await onStandby("select count(*) from pg_roles where rolname = 'lag_reader'")) === "1",
      "the standby to replay the role",
    );
    // Older than the demanded lag, so only "replayed through the primary's position" lets the read stay.
    await sleep(1500);
    const urlOf = (host: string, port: number): string =>
      `postgresql://lag_reader:${password}@${host}:${port}/${primary.getDatabase()}`;
    const reader = await PostgresDatabaseDriver.connect({
      url: urlOf(primary.getHost(), primary.getPort()),
      replicas: [urlOf(standby.getHost(), standby.getMappedPort(5432))],
      replicaProbe: Duration.seconds(0.05),
      entities: [],
    });
    try {
      const standbyRead = async (): Promise<boolean> =>
        (await reader.em().execute("select pg_is_in_recovery() as standby"))[0]?.["standby"] ===
        true;
      expect(await reader.onReplica(standbyRead, { maxLag: Duration.seconds(1) })).toBe(true);
      // With no primary position (the primary did not answer) the standby is never caught up: its lag decides.
      expect(
        await reader.orm.em
          .getConnection("read")
          .execute<Record<string, unknown>>(REPLICA_POSITION_SQL, [null], "get"),
      ).toMatchObject({ standby: true, caught_up: false });
    } finally {
      await reader.close();
      ACTIVE_DATABASE.current = database;
    }
  });

  // Leaves the standby cut from the primary, so it runs last.
  it("skips a standby whose WAL receiver is cut, though it has replayed all it received", async () => {
    const database = ready(state.database, "database");
    const strict = { maxLag: Duration.seconds(1) };

    await onStandby("alter system set primary_conninfo = 'host=primary-cut.invalid'");
    await onStandby("select pg_reload_conf()");
    await until(
      async () =>
        (await onStandby(
          "select count(*) from pg_stat_wal_receiver where status = 'streaming'",
        )) === "0",
      "the standby's WAL receiver to stop streaming",
    );
    await database.em().execute("insert into public.lag_probe values (3)");
    const wroteAt = new Date();
    await sleep(1500);
    // The standby never received the write, so its own positions agree: it has replayed all it received.
    expect(await onStandby("select pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn()")).toBe(
      "t",
    );
    expect(await onStandby("select count(*) from public.lag_probe")).toBe("2");

    // The guarded reads run on the primary and see the write.
    expect(await database.onReplica(onAStandby, strict)).toBe(false);
    expect(await database.onReplica(rowCount, strict)).toBe(3);
    expect(
      await database.onReplica(onAStandby, { maxLag: Duration.seconds(3600), after: wroteAt }),
    ).toBe(false);
    // An unguarded read still reads the cut standby.
    expect(await database.onReplica(rowCount)).toBe(2);
  });
});
