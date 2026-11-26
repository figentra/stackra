/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseReplicaReadsDriver`: it is the actions `ReplicaReads`, it runs work through the
 *          connected database's `onReplica` with the lag guard (the visit's `maxLag`, else `replicaReads.maxLag`, and
 *          the writer's latest remembered or carried write as `after`), it places a query by its key's override, else
 *          its area's, else its declaration, and it pins a writer to the primary inside `readYourWrites` after its own
 *          write or a carried `lastWriteAt`, and not after the window or for another writer.
 * Boundary: test only; the database is a stand-in that records its replica reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0057 (decision 6); ADR 0142; ADR 0022; ADR 0269; STA-1504; STA-1464.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { ReplicaReads } from "@stackra/actions/contracts";
import type { ReplicaQuery, ReplicaVisit } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { ApiArea, Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { Database } from "#core/ports/database.port";
import type { ReplicaFreshness } from "#core/types/replica-freshness.type";
import type { ReplicaReadsSettings } from "#core/types/replica-reads-settings.type";
import { DatabaseReplicaReadsDriver } from "#node/drivers/database-replica-reads.driver";

const AT = new Date("2026-10-28T10:00:00.000Z");

/** A database that records each replica read and the freshness it demanded. */
class RecordingDatabase extends Database {
  readonly demanded: ReplicaFreshness[] = [];

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

  override async onReplica<T>(
    work: () => Promise<T>,
    freshness: ReplicaFreshness = {},
  ): Promise<T> {
    this.replicaReads += 1;
    this.demanded.push(freshness);
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

/** The driver with a `seconds`-second window and the given replica settings over the defaults. */
function driver(
  seconds = 5,
  replicaReads: Partial<ReplicaReadsSettings> = {},
): DatabaseReplicaReadsDriver {
  return new DatabaseReplicaReadsDriver(
    buildConfig(DatabaseConfig, {
      values: {
        readYourWrites: Duration.seconds(seconds),
        replicaReads: {
          maxLag: Duration.seconds(5),
          probeEvery: Duration.seconds(1),
          queries: {},
          areas: {},
          ...replicaReads,
        },
      },
    }),
  );
}

/** A query as the pipeline describes it. */
function query(overrides: Partial<ReplicaQuery> = {}): ReplicaQuery {
  return { key: "visit.list", area: ApiArea.App, declared: "replica", ...overrides };
}

/** A visit of `writer` at `AT`. */
function visit(overrides: Partial<ReplicaVisit> = {}): ReplicaVisit {
  return { ...query(), writer: "scp_1:usr_1", at: AT, ...overrides };
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

  it("demands the visit's maxLag, else the configured one, and the writer's latest write (STA-1464)", async () => {
    const database = new RecordingDatabase();
    ACTIVE_DATABASE.current = database;
    const reads = driver(5, { maxLag: Duration.seconds(3) });
    await reads.onReplica(async () => "rows", visit({ maxLag: Duration.seconds(1) }));
    await reads.onReplica(async () => "rows", visit());
    await reads.onReplica(async () => "rows");
    await reads.wrote("scp_1:usr_1", later(-30_000));
    await reads.onReplica(async () => "rows", visit());
    await reads.onReplica(async () => "rows", visit({ lastWriteAt: later(-10_000) }));
    await reads.onReplica(async () => "rows", visit({ lastWriteAt: later(-60_000) }));
    await reads.onReplica(async () => "rows", visit({ writer: "scp_1:usr_2" }));
    expect(database.demanded).toEqual([
      { maxLag: "PT1S" },
      { maxLag: "PT3S" },
      { maxLag: "PT3S" },
      { maxLag: "PT3S", after: later(-30_000) },
      { maxLag: "PT3S", after: later(-10_000) },
      { maxLag: "PT3S", after: later(-30_000) },
      { maxLag: "PT3S" },
    ]);
  });

  it("places a query by its key's override, else its area's, else its declaration (STA-1464)", () => {
    const reads = driver(5, {
      queries: { "visit.list": "primary", "order.get": "replica" },
      areas: { admin: "replica", app: "primary" },
    });
    expect(reads.reads(query())).toBe("primary");
    expect(reads.reads(query({ key: "order.get", declared: "primary" }))).toBe("replica");
    expect(
      reads.reads(query({ key: "order.list", area: ApiArea.Admin, declared: "primary" })),
    ).toBe("replica");
    expect(reads.reads(query({ key: "order.list", area: ApiArea.App }))).toBe("primary");
    expect(reads.reads(query({ key: "order.list", area: ApiArea.Platform }))).toBe("replica");
    expect(driver().reads(query({ key: "constructor", declared: "primary" }))).toBe("primary");
    expect(driver().reads(query())).toBe("replica");
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
