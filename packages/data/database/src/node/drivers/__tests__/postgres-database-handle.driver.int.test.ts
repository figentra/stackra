/**
 * Stackra file contract:
 * Purpose: the container-built `PostgresDatabaseDriver` on a real Postgres: an instance made with no ORM (what the container
 *          binds to the `Database` port, so what a service that injects `Database` gets) reaches the connection the app's boot
 *          made: the same MikroORM instance, statements and transactions through it, rows written through the connected driver
 *          visible through the handle, and the detached-call store shared with the connected driver.
 * Boundary: integration tier (`.int`, Docker); `usePostgres` plays the generated boot (`PostgresDatabaseDriver.connect`), and the
 *           handle is built the way the container builds it, `new PostgresDatabaseDriver()`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (test tiers); ADR 0238; STA-1652.
 */
import type { DetachedStep } from "@stackra/actions/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Database } from "#core/ports/database.port";
import { PostgresDatabaseDriver } from "#node/drivers/postgres-database.driver";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({ migrations: [] });

/** A handle built as the container builds the port's driver. */
const handle = () => new PostgresDatabaseDriver();

describe("a PostgresDatabaseDriver built with no ORM, with a database connected", () => {
  /** It is a view of the connected driver, not a second connection. */
  it("shares the connected driver's MikroORM instance", () => {
    expect(handle().orm).toBe((postgres.database as PostgresDatabaseDriver).orm);
  });

  /** A statement through the handle runs on the real database. */
  it("runs statements and transactions on the connected database", async () => {
    const rows = (await handle().em().execute("select 1 as one")) as { one: number }[];
    expect(rows).toEqual([{ one: 1 }]);
    await handle().transaction(async () => {
      await handle().em().execute("create table handle_probe (n int)");
      await handle().em().execute("insert into handle_probe values (7)");
    });
    // written through the handle, read through the connected driver
    expect(await postgres.database.em().execute("select n from handle_probe")).toEqual([{ n: 7 }]);
    // and the other way round
    await postgres.database.em().execute("insert into handle_probe values (8)");
    expect(await handle().em().execute("select n from handle_probe order by n")).toEqual([
      { n: 7 },
      { n: 8 },
    ]);
  });

  /** `Database.detached()` reads the connected driver's store, so a handle's detached run is seen by it. */
  it("runs a detached call in the connected driver's detached store", async () => {
    const step = { name: "probe" } as unknown as DetachedStep;
    const seen = await handle().runDetached(step, () =>
      Promise.resolve([Database.detached(), postgres.database.detached(), handle().detached()]),
    );
    expect(seen).toEqual([step, step, step]);
    expect(handle().detached()).toBeUndefined();
  });
});
