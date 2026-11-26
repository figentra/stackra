/**
 * Stackra file contract:
 * Purpose: unit tests of the lag guard's reading in `PostgresDatabaseDriver.onReplica`: it reads the primary's position
 *          first and hands it to the replica's statement, so a replica is caught up only against the primary (never
 *          against the WAL it received itself); a primary that does not answer hands null, and a replica judged by
 *          its lag alone that lags past `maxLag` sends the read to the primary.
 * Boundary: test only; the ORM is a stand-in that records each statement on the primary and the replica connection and
 *           answers it, so no Postgres runs. The real statements are proved on a streaming standby in
 *           `postgres-replica-lag.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0057 (decision 6: read replica); STA-1464.
 */
import type { MikroORM } from "@mikro-orm/postgresql";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PRIMARY_POSITION_SQL } from "#core/constants/primary-position-sql.constant";
import { REPLICA_POSITION_SQL } from "#core/constants/replica-position-sql.constant";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";

/** One statement a stand-in connection ran. */
interface Ran {
  readonly on: "primary" | "replica";
  readonly sql: string;
  readonly params: readonly unknown[];
}

/**
 * A driver over a stand-in ORM with one replica: the primary answers `primary` (or rejects with it), the replica
 * answers `replica`, and every statement lands in `ran`.
 */
function driverWith(
  primary: Readonly<Record<string, unknown>> | Error,
  replica: Readonly<Record<string, unknown>>,
): { readonly driver: PostgresDatabaseDriver; readonly ran: Ran[] } {
  const ran: Ran[] = [];
  const connection = (on: Ran["on"]) => ({
    execute: async (sql: string, params: readonly unknown[] = []) => {
      ran.push({ on, sql, params });
      if (on === "replica") return replica;
      if (primary instanceof Error) throw primary;
      return primary;
    },
  });
  const read = connection("replica");
  const write = connection("primary");
  const orm = {
    config: { get: (key: string) => (key === "replicas" ? [{ clientUrl: "replica" }] : undefined) },
    em: { getConnection: (type?: string) => (type === "read" ? read : write) },
  };
  return { driver: new PostgresDatabaseDriver(orm as unknown as MikroORM), ran };
}

describe("PostgresDatabaseDriver lag guard reading (STA-1464)", () => {
  it("reads the primary's position first and hands it to the replica's statement", async () => {
    const { driver, ran } = driverWith(
      { lsn: "0/5018E40" },
      { standby: true, caught_up: false, lag_ms: 5000 },
    );

    expect(await driver.onReplica(async () => "primary", { maxLag: Duration.seconds(1) })).toBe(
      "primary",
    );
    expect(ran).toEqual([
      { on: "primary", sql: PRIMARY_POSITION_SQL, params: [] },
      { on: "replica", sql: REPLICA_POSITION_SQL, params: ["0/5018E40"] },
    ]);
  });

  it("hands null when the primary does not answer, so the replica's lag alone decides", async () => {
    const { driver, ran } = driverWith(new Error("primary down"), {
      standby: true,
      caught_up: false,
      lag_ms: 5000,
    });

    expect(await driver.onReplica(async () => "primary", { maxLag: Duration.seconds(1) })).toBe(
      "primary",
    );
    expect(ran.at(-1)).toEqual({ on: "replica", sql: REPLICA_POSITION_SQL, params: [null] });
  });
});
