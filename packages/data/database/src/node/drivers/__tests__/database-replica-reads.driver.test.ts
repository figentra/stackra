/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseReplicaReadsDriver`: it is the actions `ReplicaReads`, it runs work through the
 *          connected database's `onReplica`, and it pins a writer to the primary inside `readYourWrites` after its own
 *          write or a carried `lastWriteAt`, and not after the window or for another writer.
 * Boundary: test only; the database is a stand-in that records its replica reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0057 (decision 6); ADR 0142; ADR 0022; ADR 0269; STA-1504.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { ReplicaReads } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";
import { DatabaseReplicaReadsDriver } from "#node/drivers/database-replica-reads.driver";

const AT = new Date("2026-10-28T10:00:00.000Z");

/** A database that records each replica read. */
class RecordingDatabase extends Database {
  replicaReads = 0;

  em(): EntityManager {
    throw new Error("not used");
  }

  async transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  override async onReplica<T>(work: () => Promise<T>): Promise<T> {
    this.replicaReads += 1;
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

/** The driver with a `seconds`-second window. */
function driver(seconds = 5): DatabaseReplicaReadsDriver {
  return new DatabaseReplicaReadsDriver(
    buildConfig(DatabaseConfig, { values: { readYourWrites: Duration.seconds(seconds) } }),
  );
}

/** `at` moved by `ms`. */
function later(ms: number): Date {
  return new Date(AT.getTime() + ms);
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
});

describe(DatabaseReplicaReadsDriver, () => {
  it("is the actions ReplicaReads and reads through the connected database's replica", async () => {
    const database = new RecordingDatabase();
    ACTIVE_DATABASE.current = database;
    const reads = driver();
    expect(reads).toBeInstanceOf(ReplicaReads);
    expect(await reads.onReplica(async () => "rows")).toBe("rows");
    expect(database.replicaReads).toBe(1);
  });

  it("pins a writer inside its window after its own write, and not after it or for another writer", async () => {
    const reads = driver(5);
    await reads.wrote("scp_1:usr_1", AT);
    expect(await reads.pinned("scp_1:usr_1", later(4999))).toBe(true);
    expect(await reads.pinned("scp_1:usr_1", later(5000))).toBe(false);
    expect(await reads.pinned("scp_1:usr_2", later(1))).toBe(false);
    expect(await reads.pinned("scp_2:usr_1", later(1))).toBe(false);
  });

  it("pins on a last write the transport carried", async () => {
    const reads = driver(5);
    expect(await reads.pinned("-:usr_1", later(1000), AT)).toBe(true);
    expect(await reads.pinned("-:usr_1", later(9000), AT)).toBe(false);
  });

  it("keeps the latest write when an older one arrives late", async () => {
    const reads = driver(5);
    await reads.wrote("-:usr_1", later(3000));
    await reads.wrote("-:usr_1", AT);
    expect(await reads.pinned("-:usr_1", later(7000))).toBe(true);
  });

  it("sweeps closed windows once many writers are remembered", async () => {
    const reads = driver(5);
    for (let index = 0; index < 1000; index += 1) await reads.wrote(`-:usr_${index}`, AT);
    await reads.wrote("-:fresh", later(10_000));
    expect(await reads.pinned("-:usr_0", later(10_001))).toBe(false);
    expect(await reads.pinned("-:fresh", later(10_001))).toBe(true);
  });
});
