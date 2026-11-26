/**
 * Stackra file contract:
 * Purpose: integration tests of `DatabaseHealthIndicatorDriver`'s role probe (`health.rowSecurity`) on a real Postgres
 *          (tenancy gap J): a runtime role with only table grants is up; the container's superuser, the owner of a
 *          table with row-level security, a member of `stackra_system_access` and a role with CREATEROLE are each
 *          down, with the reason.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The superuser creates the roles; each probe runs
 *           as one of them with `set local session authorization`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (gap J); ADR 0182 (integration tier); ADR 0022.
 */
import { buildConfig } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { DatabaseConfig } from "#config/database.config";
import type { Database } from "#core/ports/database.port";
import { DatabaseHealthIndicatorDriver } from "#node/drivers/database-health-indicator.driver";
import { usePostgres } from "#testing/use-postgres";

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "create role rt_safe nologin nobypassrls",
            "create role rt_owner nologin nobypassrls",
            "create role rt_system nologin nobypassrls",
            "create role rt_creates nologin nobypassrls createrole",
            "create role stackra_system_access nologin nobypassrls",
            "grant stackra_system_access to rt_system",
            "create schema health_probe",
            "create table health_probe.notes (id int primary key, tenant_id text not null)",
            "alter table health_probe.notes enable row level security",
            "alter table health_probe.notes force row level security",
            "alter table health_probe.notes owner to rt_owner",
            "grant usage on schema health_probe to rt_safe",
            "grant select, insert, update, delete on health_probe.notes to rt_safe",
          ],
        },
      ],
    },
  ],
});

/** The indicator, with `rowSecurity` on, probing as `role` (the container's superuser when undefined). */
function indicator(role?: string): DatabaseHealthIndicatorDriver {
  const execute = (sql: string): Promise<unknown> =>
    postgres.database.transaction(async () => {
      const em = postgres.database.em();
      if (role !== undefined) await em.execute(`set local session authorization ${role}`);
      return em.execute(sql);
    });
  const port = { em: () => ({ execute }) } as unknown as Database;
  const config = buildConfig(DatabaseConfig, {
    values: { health: { timeout: Duration.seconds(5), critical: true, rowSecurity: true } },
  });
  return new DatabaseHealthIndicatorDriver(port, config);
}

/** The probe's detail as `role`. */
const detail = async (role?: string): Promise<string | undefined> =>
  (await indicator(role).check()).detail;

describe("DatabaseHealthIndicatorDriver role probe (Postgres)", () => {
  it("is up for a runtime role with only table grants", async () => {
    expect((await indicator("rt_safe").check()).status).toBe("up");
  });

  it("is down for the superuser, an owner, a system-access member and a role that creates roles", async () => {
    expect(await detail()).toBe(
      "the database is open: its role can bypass row-level security (a superuser or BYPASSRLS)",
    );
    expect(await detail("rt_owner")).toBe(
      "the database is open: its role owns 1 tables with row-level security",
    );
    expect(await detail("rt_system")).toBe(
      "the database is open: its role may act as stackra_system_access",
    );
    expect(await detail("rt_creates")).toBe(
      "the database is open: its role can create roles or databases",
    );
  });
});
