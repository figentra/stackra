/**
 * Stackra file contract:
 * Purpose: unit tests of `maintainPartitions`: it creates the current partition and `premake` ahead (skipping one that
 *          exists), drops an expired dated partition with no held row, keeps one a hold covers, never touches the
 *          default partition, and refuses a model that is not `Partitioned`.
 * Boundary: test only; the database is a stand-in whose entity manager records the SQL and answers the catalog and
 *           partition reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; data-layer gaps db12, sc4; ADR 0134 (holds).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { Duration } from "@stackra/contracts";
import { HasPublicId, Model, Partitioned } from "@stackra/model";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ACTIVE_DATABASE } from "#core/constants/active-database.constant";
import { connectHoldRegistry } from "#core/functions/connect-hold-registry.function";
import { maintainPartitions } from "#core/functions/maintain-partitions.function";
import { Database } from "#core/ports/database.port";
import type { HoldRegistry } from "#contracts/ports/hold-registry.port";

class MeterEvent extends Model.with(
  HasPublicId("mev"),
  Partitioned({ by: "occurredAt", interval: "month", premake: 1, retain: Duration.days(60) }),
) {}

class Plain extends Model.with(HasPublicId("pln")) {}

/** An entity manager whose catalog holds `existing` partitions and whose expired rows are `rows`. */
function fakeEm(existing: readonly string[], rows: Record<string, unknown>[]) {
  const executed: string[] = [];
  const em = {
    getMetadata: () => ({
      className: "MeterEvent",
      schema: "usage",
      tableName: "meter_events",
      primaryKeys: ["id"],
      properties: { id: { fieldNames: ["id"] } },
    }),
    execute: vi.fn(async (sql: string, params: unknown[] = []) => {
      executed.push(sql);
      if (sql.startsWith("select to_regclass"))
        return [{ created: !existing.includes(String(params[0]).split(".")[1] ?? "") }];
      if (sql.startsWith("select c.relname")) return existing.map((name) => ({ name }));
      if (sql.startsWith('select "id" as "id" from')) return rows;
      return [];
    }),
  };
  return { em, executed };
}

class FakeDatabase extends Database {
  private readonly manager: EntityManager;

  constructor(manager: EntityManager) {
    super();
    this.manager = manager;
  }

  em(): EntityManager {
    return this.manager;
  }

  transaction<T>(work: () => Promise<T>): Promise<T> {
    return work();
  }

  withScope<T>(_scopes: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }

  async close(): Promise<void> {
    await Promise.resolve();
  }
}

const now = new Date("2026-10-28T12:00:00Z");

afterEach(() => {
  ACTIVE_DATABASE.current = undefined;
  connectHoldRegistry(undefined);
});

describe("maintainPartitions", () => {
  it("creates the current partition and premake ahead, and drops an expired free one", async () => {
    const { em, executed } = fakeEm(
      ["meter_events_p20261001", "meter_events_p20260701", "meter_events_default"],
      [{ id: "mev_1" }],
    );
    ACTIVE_DATABASE.current = new FakeDatabase(em as unknown as EntityManager);
    const report = await maintainPartitions(MeterEvent, now);
    expect(report).toEqual({
      table: "usage.meter_events",
      created: ["meter_events_p20261101"],
      dropped: ["meter_events_p20260701"],
      held: [],
    });
    expect(executed).toContain(
      `create table if not exists "usage"."meter_events_p20261101" partition of "usage"."meter_events" for values from ('2026-11-01T00:00:00.000Z') to ('2026-12-01T00:00:00.000Z')`,
    );
    expect(executed).toContain('drop table "usage"."meter_events_p20260701"');
    expect(executed.some((sql) => sql.includes('meter_events_default" '))).toBe(false);
  });

  it("keeps an expired partition a legal hold covers", async () => {
    const { em, executed } = fakeEm(["meter_events_p20260701"], [{ id: "mev_1" }, { id: "mev_2" }]);
    ACTIVE_DATABASE.current = new FakeDatabase(em as unknown as EntityManager);
    connectHoldRegistry({
      heldAmong: async () => new Set(["mev_2"]),
    } as unknown as HoldRegistry);
    const report = await maintainPartitions(MeterEvent, now);
    expect(report.held).toEqual(["meter_events_p20260701"]);
    expect(executed.some((sql) => sql.startsWith("drop table"))).toBe(false);
  });

  it("refuses a model that is not Partitioned", async () => {
    await expect(maintainPartitions(Plain, now)).rejects.toThrow("not Partitioned");
  });
});
