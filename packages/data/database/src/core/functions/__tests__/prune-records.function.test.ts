/**
 * Stackra file contract:
 * Purpose: unit tests of `pruneRecords`: a `hard` retention deletes expired rows in keyset chunks, asking the
 *          registry with `Disposal.Retention` and keeping held rows; a `soft` or `archive` retention stamps its field on
 *          expired live rows and refuses a model without the trait it writes; a `SoftDeletes` model's rows deleted more
 *          than 30 days ago are purged; a watched model's deletes reach the native-write watcher.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0134 (decision 3); ADR 0189 (decision 4); data-layer gap gov4.
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Duration } from "@stackra/contracts";
import { Archivable, HasPublicId, Model, Retention, SoftDeletes } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { connectNativeWriteWatcher } from "#core/functions/connect-native-write-watcher.function";
import { pruneRecords } from "#core/functions/prune-records.function";
import type { Database } from "#core/ports/database.port";
import { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

const NOW = new Date("2026-10-28T00:00:00Z");

class Thread extends Model.with(
  HasPublicId("thr"),
  Retention({ keep: Duration.days(90), basis: "createdAt", policy: "hard" }),
) {}

class Note extends Model.with(
  HasPublicId("not"),
  SoftDeletes,
  Retention({ keep: Duration.days(365), basis: "createdAt", policy: "soft" }),
) {}

class Project extends Model.with(
  HasPublicId("prj"),
  Retention({ keep: Duration.days(30), basis: "closedAt", policy: "archive" }),
) {}

class Ticket extends Model.with(HasPublicId("tkt"), Archivable) {}

/** A recording entity manager whose `find` answers the queued pages in turn. */
function fakeEm(pages: readonly (readonly { id: string }[])[] = []) {
  const queue = [...pages];
  return {
    find: vi.fn(async (..._args: unknown[]) => queue.shift() ?? []),
    nativeDelete: vi.fn(async (..._args: unknown[]) => 1),
    nativeUpdate: vi.fn(async (..._args: unknown[]) => 3),
    getMetadata: vi.fn(() => ({ primaryKeys: ["id"] })),
  };
}

/** Connects a database whose entity manager is `em`. */
function connect(em: ReturnType<typeof fakeEm>): void {
  ACTIVE_DATABASE.current = {
    em: () => em as unknown as EntityManager,
  } as unknown as Database;
}

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  connectHoldRegistry(undefined);
  connectNativeWriteWatcher(undefined);
});

describe(pruneRecords, () => {
  it("deletes expired rows in keyset chunks, keeping the ones a hold covers", async () => {
    const em = fakeEm([[{ id: "thr_1" }, { id: "thr_2" }], [{ id: "thr_3" }]]);
    connect(em);
    const asked: unknown[] = [];
    connectHoldRegistry({
      heldAmong: async (model: unknown, ids: readonly string[], disposal: Disposal) => {
        asked.push([model, ids, disposal]);
        return new Set(ids.filter((id) => id === "thr_2"));
      },
    } as unknown as HoldRegistry);
    const report = await pruneRecords(Thread, NOW, { chunk: 2 });
    expect(report).toEqual({ model: "Thread", expired: 0, purged: 2, held: 1 });
    expect(asked).toEqual([
      [Thread, ["thr_1", "thr_2"], Disposal.Retention],
      [Thread, ["thr_3"], Disposal.Retention],
    ]);
    const cutoff = new Date("2026-07-30T00:00:00Z");
    expect(em.find.mock.calls[0]?.[1]).toEqual({ createdAt: { $lt: cutoff } });
    expect(em.find.mock.calls[1]?.[1]).toEqual({
      $and: [{ createdAt: { $lt: cutoff } }, { id: { $gt: "thr_2" } }],
    });
    expect(em.nativeDelete.mock.calls[0]?.[1]).toEqual({ id: { $in: ["thr_1"] } });
  });

  it("soft-deletes expired live rows, then purges rows deleted more than 30 days ago", async () => {
    const em = fakeEm([[{ id: "not_9" }]]);
    connect(em);
    const report = await pruneRecords(Note, NOW);
    expect(report).toEqual({ model: "Note", expired: 3, purged: 1, held: 0 });
    expect(em.nativeUpdate.mock.calls[0]?.[1]).toEqual({
      $and: [{ createdAt: { $lt: new Date("2025-10-28T00:00:00Z") } }, { deletedAt: null }],
    });
    expect(em.nativeUpdate.mock.calls[0]?.[2]).toMatchObject({ deletedAt: NOW });
    expect(em.find.mock.calls[0]?.[1]).toEqual({
      deletedAt: { $lt: new Date("2026-09-28T00:00:00Z") },
    });
  });

  it("refuses an archive policy on a model that is not Archivable, and leaves a plain Archivable model alone", async () => {
    connect(fakeEm());
    await expect(pruneRecords(Project, NOW)).rejects.toThrow(TypeError);
    await expect(pruneRecords(Ticket, NOW)).resolves.toEqual({
      model: "Ticket",
      expired: 0,
      purged: 0,
      held: 0,
    });
  });

  it("reports a watched model's deletes to the native-write watcher", async () => {
    const em = fakeEm([[{ id: "thr_1" }], [{ id: "thr_1" }]]);
    connect(em);
    const written: unknown[] = [];
    connectNativeWriteWatcher({
      watches: () => true,
      written: async ({ kind, ids }) => {
        written.push([kind, ids]);
      },
    });
    await pruneRecords(Thread, NOW);
    expect(written).toEqual([["deleted", ["thr_1"]]]);
  });
});
