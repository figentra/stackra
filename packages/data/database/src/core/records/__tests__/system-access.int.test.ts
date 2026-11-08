/**
 * Stackra file contract:
 * Purpose: integration tests of the system-access mechanism on a real Postgres (ADR 0239 amendment, gap A): a tenant
 *          table under its forced equality policy with `t.systemAccess`, and two `schema.systemFunction`s, a lookup
 *          (a job's tenant) and a claim (due jobs across tenants, `FOR UPDATE SKIP LOCKED`, a lease update, ids and
 *          the tenant id only). The migration runs as `svc`, a non-superuser with `CREATEROLE` that is also the
 *          service's role, as on a managed Postgres. The lookup answers a known id's tenant and NULL for an unknown
 *          one; two claims at once take disjoint rows of both tenants and set their lease; each claimed row loads in its
 *          tenant (the `app.tenant_id` setting, as `withTenant` writes it) while a session with no tenant still sees
 *          none. `svc` cannot read the table with no tenant or `SET ROLE` to the role (it holds only the ADMIN-only
 *          membership Postgres gives a role's creator), and can execute both functions, which a role with no grant
 *          cannot. The role reads only the declared columns and writes none but the lease.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's superuser creates `svc` and
 *           seeds the rows; everything else runs as `svc`, or as the role itself, with `set local role`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A); ADR 0182 (integration tier); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

const ACME = "scp_acme";
const GLOBEX = "scp_globex";

class CreateJobsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("jobs", (t: Blueprint) => {
      t.hasPublicId("job");
      t.string("tenant_id", 33).notNull().comment("The owning tenant.");
      t.string("payload").notNull().comment("The job's tenant data.");
      t.timestamp("due_at").notNull().comment("When the job is due.");
      t.timestamp("leased_until").nullable().comment("When the claim's lease ends.");
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" });
      t.systemAccess({
        select: ["id", "tenant_id", "due_at", "leased_until"],
        update: ["leased_until"],
        reason: "the worker claims due jobs across tenants",
      });
    });
    schema.systemFunction({
      name: "job_tenant",
      args: { job_id: "varchar(33)" },
      returns: { tenant_id: "varchar(33)" },
      sql: "select (select j.tenant_id from jobs.jobs j where j.id = job_id)",
      reason: "a provider webhook finds which tenant owns a job",
    });
    schema.systemFunction({
      name: "claim_due_jobs",
      args: { max_jobs: "integer" },
      returns: { id: "varchar(33)", tenant_id: "varchar(33)" },
      sql: [
        "with due as (",
        "  select j.id from jobs.jobs j",
        "  where j.due_at <= pg_catalog.now() and (j.leased_until is null or j.leased_until < pg_catalog.now())",
        "  order by j.due_at limit max_jobs for update skip locked",
        ")",
        "update jobs.jobs j set leased_until = pg_catalog.now() + interval '5 minutes'",
        "from due where j.id = due.id returning j.id, j.tenant_id",
      ].join("\n"),
      reason: "the worker claims due jobs across tenants",
    });
  }
}

const migration = compileMigration(CreateJobsMigration, { schema: "jobs", createsSchema: true });

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "create role svc nologin createrole nobypassrls",
            "create role outsider nologin",
            "do $$ begin execute format('grant create on database %I to svc', current_database()); end $$",
          ],
        },
      ],
    },
    // The migration as the non-superuser service role, which holds CREATEROLE as a managed Postgres's master user
    // does, in one explicit transaction so the SET LOCAL holds for every statement.
    {
      ...migration,
      steps: migration.steps.map((step) => ({
        ...step,
        sql: ["begin", "set local role svc", ...step.sql, "commit"],
      })),
    },
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            `insert into jobs.jobs (id, tenant_id, payload, due_at) values
              ('job_a1', '${ACME}', 'acme one', now() - interval '3 minutes'),
              ('job_b1', '${GLOBEX}', 'globex one', now() - interval '2 minutes'),
              ('job_a2', '${ACME}', 'acme two', now() - interval '1 minute'),
              ('job_b2', '${GLOBEX}', 'globex later', now() + interval '1 day')`,
          ],
        },
      ],
    },
  ],
});

/** Runs `statement` as `role` (with `app.tenant_id` set to `scopeId`) in its own transaction, which it commits. */
function as(
  role: string,
  statement: string,
  params: readonly unknown[] = [],
  scopeId = "",
): Promise<Record<string, unknown>[]> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em();
    await em.execute("select set_config('app.tenant_id', ?, true)", [scopeId]);
    await em.execute(`set local role ${role}`);
    return (await em.execute(statement, [...params])) as Record<string, unknown>[];
  });
}

const CLAIM = "select * from jobs.claim_due_jobs(?) order by id";

describe("system access (t.systemAccess, schema.systemFunction)", () => {
  it("looks up a known job's tenant, and NULL for an unknown one, with no tenant set", async () => {
    const lookup = "select tenant_id from jobs.job_tenant(?)";
    expect(await as("svc", lookup, ["job_b1"])).toEqual([{ tenant_id: GLOBEX }]);
    expect(await as("svc", lookup, ["job_none"])).toEqual([{ tenant_id: null }]);
  });

  it("claims due rows across tenants with SKIP LOCKED, leases them, and loads each in its tenant", async () => {
    const { database } = postgres;
    const claims = await database.transaction(async () => {
      const em = database.em();
      await em.execute("set local role svc");
      const first = (await em.execute(CLAIM, [1])) as Record<string, unknown>[];
      // A second worker, on its own connection, while the first still holds its row: it skips that row.
      const second = await database.transaction(
        async () => {
          const inner = database.em();
          await inner.execute("set local role svc");
          return (await inner.execute(CLAIM, [10])) as Record<string, unknown>[];
        },
        { requiresNew: true },
      );
      return { first, second };
    });
    expect(claims.first).toEqual([{ id: "job_a1", tenant_id: ACME }]);
    expect(claims.second).toEqual([
      { id: "job_a2", tenant_id: ACME },
      { id: "job_b1", tenant_id: GLOBEX },
    ]);
    expect(await as("svc", CLAIM, [10])).toEqual([]);
    const leased = (await postgres.database
      .em()
      .execute("select id from jobs.jobs where leased_until is not null order by id")) as {
      id: string;
    }[];
    expect(leased.map((row) => row.id)).toEqual(["job_a1", "job_a2", "job_b1"]);

    const payload = "select payload from jobs.jobs where id = ?";
    for (const { id, tenant_id: owner } of [...claims.first, ...claims.second])
      expect(await as("svc", payload, [id], String(owner))).toHaveLength(1);
    expect(await as("svc", payload, ["job_b1"], ACME)).toEqual([]);
    expect(await as("svc", "select count(*)::int as count from jobs.jobs")).toEqual([{ count: 0 }]);
  });

  it("keeps the service role out of the role while it executes the functions, and PUBLIC out of both", async () => {
    await expect(as("svc", "set local role stackra_system_access")).rejects.toThrow(
      /permission denied/,
    );
    const [memberships] = (await postgres.database.em().execute(
      `select count(*)::int as count, bool_or(admin_option) as admin, bool_or(set_option) as "set",
         bool_or(inherit_option) as inherit
       from pg_auth_members where roleid = 'stackra_system_access'::regrole`,
    )) as { count: number; admin: boolean; set: boolean; inherit: boolean }[];
    // The one membership is the ADMIN-only one Postgres 16+ gives the CREATEROLE creator; the hand-over's is revoked.
    expect(memberships).toEqual({ count: 1, admin: true, set: false, inherit: false });
    for (const fn of ["jobs.job_tenant(varchar)", "jobs.claim_due_jobs(integer)"]) {
      const [rights] = (await postgres.database.em().execute(
        `select has_function_privilege('svc', ?::text, 'EXECUTE') as svc,
           has_function_privilege('outsider', ?::text, 'EXECUTE') as outsider,
           p.prosecdef as definer, pg_get_userbyid(p.proowner) as owner, p.proconfig::text as config
         from pg_proc p where p.oid = ?::regprocedure`,
        [fn, fn, fn],
      )) as Record<string, unknown>[];
      expect(rights).toEqual({
        svc: true,
        outsider: false,
        definer: true,
        owner: "stackra_system_access",
        config: '{"search_path=pg_catalog, pg_temp"}',
      });
    }
  });

  it("lets the role read only the declared columns and write only the lease", async () => {
    const role = "stackra_system_access";
    expect(await as(role, "select count(id)::int as count from jobs.jobs")).toEqual([{ count: 4 }]);
    for (const statement of [
      "select payload from jobs.jobs",
      "select * from jobs.jobs",
      "update jobs.jobs set payload = 'x'",
      "insert into jobs.jobs (id, tenant_id, payload, due_at) values ('job_x', 'scp_x', 'x', now())",
      "delete from jobs.jobs",
    ])
      await expect(as(role, statement)).rejects.toThrow(/permission denied/);
  });
});
