/**
 * Stackra file contract:
 * Purpose: the isolation test of the privacy tables on real Postgres, each hot path run as the NOBYPASSRLS service role
 *          over rows of two owners and the platform's. Subject salts are kept per owner: each tenant and the platform
 *          obtain their own salt of one subject, find only their own, and destroy only their own. A tenant's hold check
 *          reads only its own holds and logs its refusals there; a session with no owner reads only the platform's holds
 *          directly, while a system run's hold check claims every owner's live holds (`privacy.claim_live_holds`),
 *          checks and logs each in its owner through the isolation, and throws rather than skip a tenant's hold when no
 *          isolation is bound. `maintainPartitions`, run as a system job, keeps an expired partition whose row a
 *          tenant's hold covers (the refusal logged in that tenant) and drops one no hold covers. For one release the
 *          previous release's statements, on the old `scope_id` partition, still read and write beside this one's.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`, with a partitioned meter model registered); the superuser
 *           seeds and checks, everything under test runs as the service role (`asService`, `OwnerIsolation`). Tests
 *           share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0134 (2026-10-24 amendment: holds); ADR 0212;
 *                     ADR 0495; ADR 0182 (integration tier); ADR 0022; `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { RowIsolationMissingError } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import type { AnyClass, Container } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { connectHoldRegistry, EntitySchema, maintainPartitions } from "@stackra/database";
import { Disposal } from "@stackra/database/contracts";
import { HasPublicId, Model, Partitioned } from "@stackra/model";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresHoldRegistryDriver } from "#node/drivers/postgres-hold-registry.driver";
import { PostgresSubjectSaltStoreDriver } from "#node/drivers/postgres-subject-salt-store.driver";

/** Two owners (tenant nodes). */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

class Invoice {}

/** A partitioned model whose expired partitions the retention drops. */
class MeterEvent extends Model.with(
  HasPublicId("mev"),
  Partitioned({ by: "occurredAt", interval: "month", premake: 1, retain: Duration.days(60) }),
) {
  occurredAt!: Date;
}

const MeterEventSchema = new EntitySchema<MeterEvent>({
  class: MeterEvent,
  schema: "usage",
  tableName: "meter_events",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    occurredAt: { type: "datetime", columnType: "timestamptz" },
  },
});

/** A resolver binding `isolation`, or nothing. */
const resolverOf = (isolation?: CallIsolation): Container =>
  ({
    has: (type: AnyClass) => isolation !== undefined && type === CallIsolation,
    get: () => isolation,
  }) as unknown as Container;

describe.skipIf(HOST === undefined)("privacy row security on Postgres", () => {
  let postgres: OwnerPostgres;
  let isolation: OwnerIsolation;

  beforeAll(async () => {
    postgres = await ownerPostgres(undefined, [MeterEventSchema]);
    isolation = new OwnerIsolation(postgres);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  const salts = () => new PostgresSubjectSaltStoreDriver(postgres.database);

  const holds = (bound?: CallIsolation) =>
    new PostgresHoldRegistryDriver(postgres.database, resolverOf(bound));

  it("keeps a subject's salt per owner: each obtains, finds and destroys only its own", async () => {
    const acme = await asService(postgres, ACME, () => salts().obtain("usr_1"));
    const globex = await asService(postgres, GLOBEX, () => salts().obtain("usr_1"));
    const platform = await asService(postgres, undefined, () => salts().obtain("usr_1"));
    expect(acme).toHaveLength(32);
    expect(
      new Set([acme, globex, platform].map((salt) => Buffer.from(salt).toString("hex"))).size,
    ).toBe(3);
    expect(await asService(postgres, ACME, () => salts().obtain("usr_1"))).toEqual(acme);
    expect(await asService(postgres, ACME, () => salts().find("usr_1"))).toEqual(acme);
    expect(await asService(postgres, undefined, () => salts().find("usr_1"))).toEqual(platform);
    expect(
      await superuser("select tenant_id from privacy.subject_salts order by tenant_id nulls first"),
    ).toEqual([{ tenant_id: null }, { tenant_id: ACME }, { tenant_id: GLOBEX }]);
    await expect(asService(postgres, ACME, () => salts().destroy("usr_1"))).resolves.toBe(true);
    await expect(asService(postgres, ACME, () => salts().destroy("usr_1"))).resolves.toBe(false);
    expect(await asService(postgres, ACME, () => salts().find("usr_1"))).toBeUndefined();
    expect(await asService(postgres, GLOBEX, () => salts().find("usr_1"))).toEqual(globex);
    expect(await asService(postgres, undefined, () => salts().find("usr_1"))).toEqual(platform);
  });

  it("checks a tenant's call against its own holds only, and logs its refusals there", async () => {
    await superuser(
      `insert into privacy.legal_holds (id, tenant_id, model, record_id, reason, placed_at)
         values ('lgh_acme', ?, 'Invoice', 'inv_1', 'Matter', now()),
                ('lgh_globex', ?, 'Invoice', 'inv_1', 'Matter', now()),
                ('lgh_platform', null, 'Invoice', 'inv_2', 'Matter', now())`,
      [ACME, GLOBEX],
    );
    expect(
      await asService(postgres, ACME, () =>
        holds().heldAmong(Invoice, ["inv_1", "inv_2", "inv_3"], Disposal.Delete),
      ),
    ).toEqual(new Set(["inv_1"]));
    expect(await superuser("select tenant_id, record_id from privacy.legal_hold_refusals")).toEqual(
      [{ tenant_id: ACME, record_id: "inv_1" }],
    );
    await superuser("delete from privacy.legal_hold_refusals");
  });

  it("claims every owner's holds in a system run, and checks and logs each in its owner", async () => {
    expect(
      await asService(postgres, undefined, () =>
        postgres.database.em().execute("select id from privacy.legal_holds"),
      ),
    ).toEqual([{ id: "lgh_platform" }]);
    expect(
      await asService(postgres, undefined, () =>
        holds(isolation).heldAmong(Invoice, ["inv_1", "inv_2", "inv_3"], Disposal.Retention),
      ),
    ).toEqual(new Set(["inv_1", "inv_2"]));
    expect(
      await superuser(
        "select tenant_id, record_id from privacy.legal_hold_refusals order by tenant_id nulls first",
      ),
    ).toEqual([
      { tenant_id: null, record_id: "inv_2" },
      { tenant_id: ACME, record_id: "inv_1" },
      { tenant_id: GLOBEX, record_id: "inv_1" },
    ]);
    await superuser("delete from privacy.legal_hold_refusals");
  });

  it("throws rather than skip a tenant's hold in a system run with no isolation bound", async () => {
    await expect(
      asService(postgres, undefined, () =>
        holds().heldAmong(Invoice, ["inv_1"], Disposal.Retention),
      ),
    ).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect(await superuser("select 1 from privacy.legal_hold_refusals")).toEqual([]);
  });

  it("keeps an expired partition a tenant's hold covers in a system job, and drops one no hold covers", async () => {
    for (const statement of [
      "create schema usage",
      "create table usage.meter_events (id varchar(33) not null, occurred_at timestamptz not null) partition by range (occurred_at)",
      "create table usage.meter_events_p20260101 partition of usage.meter_events for values from ('2026-01-01') to ('2026-02-01')",
      "create table usage.meter_events_p20260201 partition of usage.meter_events for values from ('2026-02-01') to ('2026-03-01')",
      "insert into usage.meter_events values ('mev_acme', '2026-01-10'), ('mev_globex', '2026-01-11'), ('mev_free', '2026-02-10')",
      `grant usage, create on schema usage to "${postgres.role}"`,
      `alter table usage.meter_events owner to "${postgres.role}"`,
      `alter table usage.meter_events_p20260101 owner to "${postgres.role}"`,
      `alter table usage.meter_events_p20260201 owner to "${postgres.role}"`,
    ])
      await superuser(statement);
    await superuser(
      `insert into privacy.legal_holds (id, tenant_id, model, record_id, reason, placed_at)
         values ('lgh_meter', ?, 'MeterEvent', 'mev_acme', 'Matter', now())`,
      [ACME],
    );
    connectHoldRegistry(holds(isolation));
    const report = await asService(postgres, undefined, () =>
      maintainPartitions(MeterEvent, new Date("2026-11-09T00:00:00.000Z")),
    );
    expect(report.held).toEqual(["meter_events_p20260101"]);
    expect(report.dropped).toEqual(["meter_events_p20260201"]);
    expect(report.created).toEqual(["meter_events_p20261101", "meter_events_p20261201"]);
    expect(
      await superuser(
        "select tenant_id, model, record_id, disposal from privacy.legal_hold_refusals",
      ),
    ).toEqual([
      { tenant_id: ACME, model: "MeterEvent", record_id: "mev_acme", disposal: "retention" },
    ]);
  });
  it("keeps the previous release's reads and writes working for one release", async () => {
    // the previous release's partition, as its drivers and actions wrote it
    const partition = "coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')";
    const sql = (statement: string, params: readonly unknown[] = []) =>
      postgres.database.em().execute(statement, [...params]) as Promise<Record<string, unknown>[]>;
    const fresh = await asService(postgres, ACME, () => salts().obtain("usr_9"));
    await asService(postgres, ACME, async () => {
      // its upsert of a salt this release made does nothing, and its read finds that salt
      await sql(
        `insert into privacy.subject_salts (scope_id, subject, salt, created_at) values (${partition}, ?, ?, now()) ` +
          "on conflict (scope_id, subject) do nothing",
        ["usr_9", "old"],
      );
      expect(
        await sql(
          `select salt from privacy.subject_salts where scope_id = ${partition} and subject = ?`,
          ["usr_9"],
        ),
      ).toEqual([{ salt: Buffer.from(fresh).toString("base64") }]);
      // a salt it makes is this release's too
      await sql(
        `insert into privacy.subject_salts (scope_id, subject, salt, created_at) values (${partition}, ?, ?, now()) ` +
          "on conflict (scope_id, subject) do nothing",
        ["usr_8", Buffer.alloc(32, 1).toString("base64")],
      );
      // its hold, release and refusal statements
      await sql(
        `insert into privacy.legal_holds (id, scope_id, model, record_id, reason, placed_by, placed_at) values (?, ${partition}, ?, ?, ?, ?, now())`,
        ["lgh_old", "User", "usr_8", "Matter", "usr_a"],
      );
      expect(
        await sql(
          `select id from privacy.legal_holds where scope_id = ${partition} and released_at is null and record_id = ?`,
          ["usr_8"],
        ),
      ).toEqual([{ id: "lgh_old" }]);
      await sql(
        `insert into privacy.legal_hold_refusals (scope_id, model, record_id, disposal, at) values (${partition}, ?, ?, ?, now())`,
        ["User", "usr_8", "purge"],
      );
      expect(
        await sql(
          `update privacy.legal_holds set released_at = now() where id = ? and scope_id = ${partition} and released_at is null returning id`,
          ["lgh_old"],
        ),
      ).toEqual([{ id: "lgh_old" }]);
    });
    expect(await asService(postgres, ACME, () => salts().find("usr_8"))).toEqual(
      new Uint8Array(Buffer.alloc(32, 1)),
    );
    expect(
      await superuser(
        "select tenant_id, scope_id from privacy.legal_hold_refusals where record_id = 'usr_8'",
      ),
    ).toEqual([{ tenant_id: ACME, scope_id: ACME }]);
  });
});
