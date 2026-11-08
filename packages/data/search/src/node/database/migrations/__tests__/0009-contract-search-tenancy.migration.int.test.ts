/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractSearchTenancyMigration` on real Postgres, over every search migration before
 *          it: the pre-flight refuses a null `tenant_id` row below the platform root, naming the count, and changes
 *          nothing, while it keeps a null row at the root (a platform row); applied, the platform form holds for an
 *          unprivileged role: a tenant reads its rows and the platform's, never another tenant's; it cannot update,
 *          delete or take over a platform row, but changes its own; a platform session changes only NULL rows; and
 *          `assertRowSecurity` warns about neither table.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The tests share one database and run in order.
 *           The container's superuser writes the seed rows, as row-level security never restricts it; each probe runs
 *           as `search_reader` in a transaction with the session settings of a tenant or of the platform.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, items 6 and 8, gap C);
 *                     ADR 0347 (decisions 1 to 3 and 5).
 */
import { compileMigration, type CompiledMigration } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { tenantIsolationOptions } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateTextFunctionsMigration } from "#node/database/migrations/0001-create-text-functions.migration";
import { CreateVectorItemsMigration } from "#node/database/migrations/0002-create-vector-items.migration";
import { CreateFoldFunctionMigration } from "#node/database/migrations/0003-create-fold-function.migration";
import { CreateVectorHnswIndexMigration } from "#node/database/migrations/0004-create-vector-hnsw-index.migration";
import { CreateSearchIndexesMigration } from "#node/database/migrations/0005-create-search-indexes.migration";
import { AddSearchIndexVersionMigration } from "#node/database/migrations/0006-add-search-index-version.migration";
import { CreateSearchQueriesMigration } from "#node/database/migrations/0007-create-search-queries.migration";
import { AddSearchTenancyMigration } from "#node/database/migrations/0008-add-search-tenancy.migration";
import { ContractSearchTenancyMigration } from "#node/database/migrations/0009-contract-search-tenancy.migration";

const TABLES = ["vector_items", "queries"];

/** Two tenants, as `withTenant` writes them, under the platform root `platform`. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

const postgres = usePostgres({
  entities: [],
  migrations: [
    CreateTextFunctionsMigration,
    CreateVectorItemsMigration,
    CreateFoldFunctionMigration,
    CreateVectorHnswIndexMigration,
    CreateSearchIndexesMigration,
    AddSearchIndexVersionMigration,
    CreateSearchQueriesMigration,
    AddSearchTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "search",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

const CONTRACT = compileMigration(ContractSearchTenancyMigration, {
  schema: "search",
  macros: [BelongsToTenantMacro],
});

/** Runs each step of `migration` in its own transaction, as the migration runner does. */
async function apply(migration: CompiledMigration): Promise<void> {
  const { database } = postgres;
  for (const step of migration.steps)
    await database.transaction(async () => {
      // raw-sql: the compiled migration's own statements
      for (const sql of step.sql) await database.em().execute(sql);
    });
}

/** Writes a `queries` row as the superuser: its owner, a tenant (null for the platform's) and its scope path. */
async function seed(owner: string | null, path: string, phrase: string): Promise<void> {
  // raw-sql: a seed row of the probe, written past row-level security
  await postgres.database.em().execute(
    `insert into "search"."queries" (id, scope_id, scope_path, model, phrase, searched_at, tenant_id)
       values (gen_random_uuid(), ?, ?::ltree, 'Product', ?, now(), ?)`,
    [owner ?? "scp_01jab3k4m5n6p7q8r9s0t1v2w0", path, phrase, owner],
  );
}

/**
 * Runs `sql` as `search_reader` with `app.tenant_id` set to `owner` ('' for a platform session) and `app.scope_paths`
 * to `paths`, and returns the rows it read or, for a write, how many rows it changed (0 when a policy refused it).
 */
function as(owner: string, paths: string, sql: string): Promise<unknown> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em();
    // raw-sql: the probe's session settings, as CallIsolation writes them, then the unprivileged role
    await em.execute(
      "select set_config('app.tenant_id', ?, true), set_config('app.scope_paths', ?, true)",
      [owner, paths],
    );
    // raw-sql: the role row-level security applies to
    await em.execute("set local role search_reader");
    if (/^\s*select/i.test(sql)) return em.execute(sql);
    // raw-sql: the probe's write
    const result = (await em.execute(sql, [], "run")) as { affectedRows?: number };
    return result.affectedRows ?? 0;
  });
}

/** The phrases a session reads, sorted. */
const phrases = async (owner: string, paths: string): Promise<string[]> =>
  (
    (await as(owner, paths, 'select phrase from "search"."queries" order by phrase')) as {
      phrase: string;
    }[]
  ).map((row) => row.phrase);

describe("ContractSearchTenancyMigration on Postgres", () => {
  it("refuses a null tenant below the platform root, naming the count, and changes nothing", async () => {
    await seed(null, "platform.acme", "missed backfill");
    try {
      await expect(apply(CONTRACT)).rejects.toThrow(
        /refused before any change: rows with a null tenant_id: search\.queries 1\. Backfill tenant_id/,
      );
      // raw-sql: the catalogue's policies of the table, which a refused contract leaves as they were
      const policies = await postgres.database
        .em()
        .execute(
          `select polname from pg_policy where polrelid = '"search"."queries"'::regclass order by polname`,
        );
      expect(policies).toEqual([{ polname: "pol_queries_scope_path" }]);
    } finally {
      // raw-sql: removes the unfilled row so the contract can apply
      await postgres.database.em().execute('delete from "search"."queries"');
    }
  });

  it("applies over a platform row at the root, and keeps tenant_id nullable", async () => {
    await seed(null, "platform", "global");
    await seed(ACME, "platform.acme", "acme");
    await seed(GLOBEX, "platform.globex", "globex");
    await apply(CONTRACT);
    // raw-sql: the catalogue's policies and the column's NOT NULL flag
    const rows = (await postgres.database.em().execute(
      `select c.relname as "table", a.attnotnull as "notNull",
         array(select p.polname || ':' || case when p.polpermissive then 'permissive' else 'restrictive' end
               from pg_policy p where p.polrelid = c.oid order by p.polname) as policies
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
       where n.nspname = 'search' and c.relname in ('vector_items', 'queries')
       order by c.relname`,
    )) as unknown[];
    expect(rows).toEqual(
      ["queries", "vector_items"].map((table) => ({
        table,
        notNull: false,
        policies: [
          `pol_${table}_scope_path:restrictive`,
          `pol_${table}_tenant_id:permissive`,
          `pol_${table}_tenant_id_write_delete:restrictive`,
          `pol_${table}_tenant_id_write_update:restrictive`,
        ],
      })),
    );
    // raw-sql: the probe role and its rights on the search tables
    await postgres.database.em().execute("create role search_reader nologin nobypassrls");
    // raw-sql: the probe role may use the schema
    await postgres.database.em().execute("grant usage on schema search to search_reader");
    // raw-sql: the probe role may read and write, so only the policies refuse it
    await postgres.database
      .em()
      .execute(
        "grant select, insert, update, delete on all tables in schema search to search_reader",
      );
  });

  it("shows a tenant its rows and the platform's, never another tenant's", async () => {
    expect(await phrases(ACME, "platform.acme")).toEqual(["acme", "global"]);
    expect(await phrases(GLOBEX, "platform.globex")).toEqual(["global", "globex"]);
    expect(await phrases("", "platform")).toEqual(["global"]);
  });

  it("keeps a tenant from updating, deleting or taking over a platform row", async () => {
    expect(
      await as(
        ACME,
        "platform.acme",
        `update "search"."queries" set phrase = 'changed' where tenant_id is null`,
      ),
    ).toBe(0);
    expect(
      await as(ACME, "platform.acme", `delete from "search"."queries" where tenant_id is null`),
    ).toBe(0);
    expect(
      await as(
        ACME,
        "platform.acme",
        `update "search"."queries" set tenant_id = '${ACME}' where tenant_id is null`,
      ),
    ).toBe(0);
    await expect(
      as(
        ACME,
        "platform.acme",
        `insert into "search"."queries" (id, scope_id, scope_path, model, searched_at, tenant_id)
         values (gen_random_uuid(), '${ACME}', 'platform', 'Product', now(), null)`,
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await phrases("", "platform")).toEqual(["global"]);
  });

  it("lets a tenant change its own rows", async () => {
    expect(
      await as(
        ACME,
        "platform.acme",
        `update "search"."queries" set hits = 3 where tenant_id = '${ACME}'`,
      ),
    ).toBe(1);
    expect(
      await as(ACME, "platform.acme", `delete from "search"."queries" where tenant_id = '${ACME}'`),
    ).toBe(1);
  });

  it("lets a platform session change only the NULL rows", async () => {
    expect(
      await as("", "platform", `update "search"."queries" set hits = 1 where tenant_id is null`),
    ).toBe(1);
    expect(
      await as(
        "",
        "platform",
        `update "search"."queries" set hits = 1 where tenant_id = '${GLOBEX}'`,
      ),
    ).toBe(0);
    expect(
      await as("", "platform", `delete from "search"."queries" where tenant_id = '${GLOBEX}'`),
    ).toBe(0);
    await expect(
      as(
        "",
        "platform",
        `insert into "search"."queries" (id, scope_id, scope_path, model, searched_at, tenant_id)
         values (gen_random_uuid(), '${GLOBEX}', 'platform.globex', 'Product', now(), '${GLOBEX}')`,
      ),
    ).rejects.toThrow(/row-level security/);
    expect(await phrases(GLOBEX, "platform.globex")).toEqual(["global", "globex"]);
  });

  it("audits both tables without a warning", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      strict: false,
    });
    expect(
      warnings.filter((warning) => TABLES.some((table) => warning.startsWith(`search.${table} `))),
    ).toEqual([]);
  });
});
