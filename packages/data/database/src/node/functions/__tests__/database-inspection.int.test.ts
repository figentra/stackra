/**
 * Stackra file contract:
 * Purpose: integration tests of the developer database inspections on real Postgres under forced row-level security
 *          (STA-2906): `queryInScope` reads a tenant's rows as the app role (where a read with no tenant sees none),
 *          refuses a role that can bypass row-level security or owns an unforced table, and cannot write, stack a
 *          second statement or change its tenant; `describeSchema` reports columns, keys and the policies; and
 *          `migrationStatus` reads applied, pending, edited and missing files without writing anything.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, so the
 *           app reads run as `stackra_app` (NOLOGIN NOBYPASSRLS) through the `role` option, as on a testbed whose
 *           connection is an admin's. Setup writes run as the superuser in `usePostgres` steps.
 * Runtime: node (vitest)
 * Governing contract: ADR 0282 (decision 5); `.agents/rules/tenancy.md` (points 2 and 8); ADR 0182 (integration
 *                     tier); ADR 0022.
 */
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { InspectionRefusedError } from "#node/errors/inspection-refused.error";
import { describeSchema } from "#node/functions/describe-schema.function";
import { migrationStatus } from "#node/functions/migration-status.function";
import { queryInScope } from "#node/functions/query-in-scope.function";
import { usePostgres } from "#testing/use-postgres";

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_7zzzzzzzzzzzzzzzzzzzzzzzzz";

/** The app's runtime role: no BYPASSRLS, owns nothing. */
const APP = "stackra_app";

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            "create schema notes",
            "create table notes.notes (id int primary key, tenant_id varchar(33) not null, body text not null)",
            "alter table notes.notes enable row level security",
            "alter table notes.notes force row level security",
            "create policy pol_notes_tenant_id on notes.notes using (tenant_id = nullif(current_setting('app.tenant_id', true), ''))",
            `insert into notes.notes values (1, '${ACME}', 'acme one'), (2, '${ACME}', 'acme two'), (3, '${GLOBEX}', 'globex')`,
            "create sequence notes.counter",
            `create role ${APP} nologin nobypassrls`,
            `grant usage on schema notes to ${APP}`,
            `grant select on all tables in schema notes to ${APP}`,
            `grant usage on sequence notes.counter to ${APP}`,
            // an owner whose table's row-level security is enabled but not forced
            "create role drafts_owner nologin nobypassrls",
            "create table notes.drafts (id int primary key)",
            "alter table notes.drafts enable row level security",
            "alter table notes.drafts owner to drafts_owner",
            "create role bypasser nologin bypassrls",
            // the runner's bookkeeping: version 2 applied, history holding an edited file and a deleted one
            "create table schema_migrations (version bigint not null primary key, dirty boolean not null)",
            "insert into schema_migrations values (2, false)",
            "create table schema_migrations_history (version bigint not null primary key, name text not null, checksum text not null, applied_at timestamptz not null default now())",
          ],
        },
      ],
    },
  ],
});

/** The environment of a testbed run against the container. */
const env = () => ({ DATABASE_URL: postgres.url, STACKRA_ENVIRONMENT: "test" });

/** Reads `sql` as the app role under `tenant`. */
const asApp = (sql: string, scope = ACME, limit?: number) =>
  queryInScope({ sql, scope, role: APP, env: env(), ...(limit === undefined ? {} : { limit }) });

/** The SHA-256 hex digest of a migration's text, as the runner records it. */
const digest = (sql: string) => createHash("sha256").update(sql).digest("hex");

/** The notes the superuser sees, unfiltered. */
async function allNotes(): Promise<number> {
  const rows = (await postgres.database
    .em()
    .execute("select count(*)::int as n from notes.notes")) as {
    n: number;
  }[];
  return rows[0]?.n ?? -1;
}

describe("queryInScope", () => {
  it("answers the tenant's rows as the app role, where a read without the tenant answers none", async () => {
    const acme = await asApp("select id, body from notes.notes order by id");
    expect(acme).toMatchObject({
      environment: "test",
      role: APP,
      scope: ACME,
      columns: ["id", "body"],
      rows: [
        { id: 1, body: "acme one" },
        { id: 2, body: "acme two" },
      ],
      rowCount: 2,
      truncated: false,
      limit: 100,
    });
    expect((await asApp("select id from notes.notes", GLOBEX)).rows).toEqual([{ id: 3 }]);
    // the zero rows a raw read gets: a tenant that owns nothing
    expect((await asApp("select id from notes.notes", "scp_nobody")).rows).toEqual([]);
  });

  it("cuts at the limit and says so", async () => {
    const result = await asApp("select id from notes.notes order by id", ACME, 1);
    expect(result).toMatchObject({ rows: [{ id: 1 }], rowCount: 1, truncated: true, limit: 1 });
  });

  it("refuses the superuser connection, and a BYPASSRLS role, instead of answering every tenant's rows", async () => {
    await expect(
      queryInScope({ sql: "select * from notes.notes", scope: ACME, env: env() }),
    ).rejects.toThrow(/can bypass row-level security/);
    await expect(
      queryInScope({ sql: "select 1", scope: ACME, role: "bypasser", env: env() }),
    ).rejects.toThrow(InspectionRefusedError);
  });

  it("refuses a role that owns a table whose row-level security is not forced", async () => {
    await expect(
      queryInScope({ sql: "select 1", scope: ACME, role: "drafts_owner", env: env() }),
    ).rejects.toThrow(/owns 1 tables whose row-level security is not forced/);
  });

  it("cannot write, stack a second statement or run outside a query expression", async () => {
    await expect(asApp("select nextval('notes.counter')")).rejects.toThrow(/read-only transaction/);
    await expect(
      asApp("with gone as (delete from notes.notes returning id) select * from gone"),
    ).rejects.toThrow();
    // on the simple protocol the `commit` would end the read-only transaction and the delete run as the superuser
    await expect(
      asApp("select 1 as one) q; commit; delete from notes.notes; select (1"),
    ).rejects.toThrow(/multiple commands/);
    await expect(asApp("delete from notes.notes")).rejects.toThrow(/syntax error/);
    expect(await allNotes()).toBe(3);
  });

  it("refuses a deployed environment before it connects", async () => {
    await expect(
      queryInScope({
        sql: "select 1",
        scope: ACME,
        role: APP,
        env: { DATABASE_URL: postgres.url, STACKRA_ENVIRONMENT: "production" },
      }),
    ).rejects.toThrow("not production");
  });
});

describe("describeSchema", () => {
  it("reports the columns, the key and the row-level security of each table", async () => {
    const { environment, tables } = await describeSchema({ schema: "notes", env: env() });
    expect(environment).toBe("test");
    expect(tables.map((table) => table.name)).toEqual(["drafts", "notes"]);
    const notes = tables.find((table) => table.name === "notes");
    expect(notes).toMatchObject({
      schema: "notes",
      primaryKey: ["id"],
      rowSecurity: { enabled: true, forced: true },
      columns: [
        { name: "id", type: "integer", nullable: false, default: null },
        { name: "tenant_id", type: "character varying(33)", nullable: false, default: null },
        { name: "body", type: "text", nullable: false, default: null },
      ],
      policies: [
        {
          name: "pol_notes_tenant_id",
          command: "ALL",
          permissive: true,
          roles: ["public"],
          check: null,
        },
      ],
    });
    expect(notes?.policies[0]?.using).toContain("app.tenant_id");
    expect(notes?.indexes.map((index) => index.name)).toEqual(["notes_pkey"]);
    expect(tables.find((table) => table.name === "drafts")?.rowSecurity).toEqual({
      enabled: true,
      forced: false,
    });
  });

  it("narrows to one table and leaves the system schemas out", async () => {
    const { tables } = await describeSchema({ table: "notes", env: env() });
    expect(tables.map((table) => `${table.schema}.${table.name}`)).toEqual(["notes.notes"]);
    const all = await describeSchema({ env: env() });
    expect(all.tables.some((table) => table.schema === "pg_catalog")).toBe(false);
    expect(all.tables.map((table) => table.name)).toContain("schema_migrations");
  });
});

describe("migrationStatus", () => {
  it("reads applied, pending, edited and missing files without writing", async () => {
    const member = mkdtempSync(join(tmpdir(), "stackra-migration-status-"));
    const folder = join(member, ".stackra", "migrations");
    mkdirSync(folder, { recursive: true });
    const files = {
      "0001_notes_0001_create": "create table a (id int);\n",
      "0002_notes_0002_add": "alter table a add column b int;\n",
      "0003_notes_0003_index": "create index on a (b);\n",
    };
    for (const [name, sql] of Object.entries(files))
      writeFileSync(join(folder, `${name}.up.sql`), sql);
    await postgres.database
      .em()
      .execute(
        "insert into schema_migrations_history (version, name, checksum) values (1, '0001_notes_0001_create', ?), (2, '0002_notes_0002_add', 'edited'), (7, '0007_notes_0007_gone', 'x')",
        [digest(files["0001_notes_0001_create"])],
      );
    const status = await migrationStatus({ cwd: member, env: env() });
    expect(status).toEqual({
      environment: "test",
      version: 2,
      dirty: false,
      ledger: true,
      migrations: [
        { version: 1, name: "0001_notes_0001_create", applied: true, edited: false },
        { version: 2, name: "0002_notes_0002_add", applied: true, edited: true },
        { version: 3, name: "0003_notes_0003_index", applied: false, edited: false },
      ],
      pending: 1,
      missing: [{ version: 7, name: "0007_notes_0007_gone" }],
    });
  });
});
