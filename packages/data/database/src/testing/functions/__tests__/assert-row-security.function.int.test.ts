/**
 * Stackra file contract:
 * Purpose: integration tests of `assertRowSecurity` on a real Postgres: a table under forced row-level security with
 *          its one owner policy and a restrictive policy named after its column passes, with no row seeded by the
 *          test (the audit seeds both owners itself, past a check constraint and a NOT NULL column); a table without
 *          the owner column is a warning naming its group (ancestor scope_path, scope_id on the setting, no RLS,
 *          unclassified) and a failure in strict mode, a listed one passes, and a listing with no reason or of an owned
 *          table fails; a table without row-level security, a second permissive policy, a misnamed restrictive
 *          policy, a leaking policy, an unseedable key and a role that bypasses row-level security are each reported,
 *          whatever the mode. Group (b) by shape: a `scope_id` table under exactly the `equals` or `equalsOrUnset`
 *          policy `Blueprint.rowLevelSecurity` writes (core payments' shape) passes strict mode and is probed by
 *          `scope_id`; a looser `... or true` variant and a second permissive policy are rejected. The compiled
 *          migrations' declarations (`migrationsDirectory`): a `t.platformTable` table passes and is refused once it
 *          holds a scope id or the owner column; a `t.reviewedPolicy` table passes with its named policies, and is
 *          refused without forced row-level security or a named policy, and when also declared a platform table.
 *          System access (ADR 0239 amendment, gap A): a table with `t.systemAccess` and its `schema.systemFunction`,
 *          compiled and declared, pass in strict mode; each variant is refused: a system-access policy to PUBLIC or
 *          to the service role, a function without SECURITY DEFINER or with an unpinned search path, PUBLIC execute,
 *          a member of the role, a BYPASSRLS role, and a column or table grant beyond the declared columns.
 * Boundary: test only; integration tier (Docker through `usePostgres`). Every test drops the tables it adds. The
 *           declarations are compiled marker lines written to a temporary directory, as gen's migration files hold them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (integration tier); ADR 0239 (decision 1); ADR 0347
 *                     (decision 5).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { assertRowSecurity } from "#testing/functions/assert-row-security.function";
import { usePostgres } from "#testing/use-postgres";

/** The owner equality on `table`. */
const ownerPolicy = (table: string, check = `"owner_id" = current_setting('app.owner_id', true)`) =>
  `create policy "pol_${table}_owner_id" on "notes"."${table}" using (${check})`;

/** An owned table: key without a default, a checked NOT NULL column, forced row-level security. */
const ownedTable = (table: string) => [
  `create table "notes"."${table}" ("id" varchar(33) primary key, "owner_id" text not null, "kind" text not null check ("kind" in ('memo', 'todo')))`,
  `alter table "notes"."${table}" enable row level security`,
  `alter table "notes"."${table}" force row level security`,
];

const postgres = usePostgres({
  migrations: [
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            'create schema "notes"',
            ...ownedTable("notes"),
            ownerPolicy("notes"),
            // The ADR 0347 shape: an unset setting sees the whole owner, so a seeded row with no kind stays visible.
            `create policy "pol_notes_kind" on "notes"."notes" as restrictive using (current_setting('app.kind', true) is null or "kind" = current_setting('app.kind', true))`,
          ],
        },
      ],
    },
  ],
});

const OPTIONS = {
  column: "owner_id",
  setting: "app.owner_id",
  role: "probe_app",
  probe: ["own_a", "own_b"],
  strict: false,
} as const;

/** One table without the owner column per group: ancestor scope_path, scope_id on the setting, no RLS, other. */
const UNOWNED_TABLES = ["ancestors", "oddities", "scoped", "tags"];
const UNOWNED = [
  'create table "notes"."ancestors" ("id" int primary key, "scope_path" text not null)',
  'alter table "notes"."ancestors" enable row level security',
  `create policy "pol_ancestors_scope_path" on "notes"."ancestors" using ("scope_path" like current_setting('app.scope_paths', true) || '%')`,
  'create table "notes"."scoped" ("id" int primary key, "scope_id" text)',
  'alter table "notes"."scoped" enable row level security',
  `create policy "pol_scoped_scope_id" on "notes"."scoped" using ("scope_id" is not distinct from current_setting('app.owner_id', true))`,
  'create table "notes"."tags" ("id" int primary key)',
  'create table "notes"."oddities" ("id" int primary key)',
  'alter table "notes"."oddities" enable row level security',
];

/** Runs `check` with extra tables made by `sql`, then drops them. */
async function withTables(
  tables: readonly string[],
  sql: readonly string[],
  check: () => Promise<void>,
): Promise<void> {
  const em = postgres.database.em();
  for (const statement of sql) await em.execute(statement);
  try {
    await check();
  } finally {
    for (const table of tables) await em.execute(`drop table "notes"."${table}"`);
  }
}

/** The SQL of a `scope_id` table as `Blueprint.rowLevelSecurity` writes it with `match`: core payments' shape. */
function scopedTable(table: string, match: "equals" | "equalsOrUnset"): readonly string[] {
  class ScopedMigration extends Migration {
    up(schema: SchemaBuilder): void {
      schema.create(table, (t: Blueprint) => {
        t.hasPublicId("lim");
        const scope = t.string("scope_id", 63).comment("The tenant that owns the row.");
        if (match === "equals") scope.notNull();
        else scope.nullable();
        t.rowLevelSecurity("scope_id", { setting: "app.owner_id", match });
      });
    }
  }
  return compileMigration(ScopedMigration, { schema: "notes" }).steps.flatMap((step) => step.sql);
}

/** Runs `check` with a migrations directory holding `sql` as one compiled file, then removes it. */
async function withMigrations(
  sql: string,
  check: (migrationsDirectory: string) => Promise<void>,
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "stackra-declarations-"));
  writeFileSync(join(directory, "0001_notes_0001_declare.up.sql"), sql);
  try {
    await check(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/** A claim table under the owner policy with system access, and its claim function, as a package writes them. */
class ClaimsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("claims", (t: Blueprint) => {
      t.hasPublicId("clm");
      t.string("owner_id", 33).notNull().comment("The owner.");
      t.string("body").notNull().comment("The owner's data.");
      t.timestamp("leased_until").nullable().comment("When the claim's lease ends.");
      t.rowLevelSecurity("owner_id", { setting: "app.owner_id", match: "equals" });
      t.systemAccess({
        select: ["id", "owner_id", "leased_until"],
        update: ["leased_until"],
        reason: "the probe worker claims rows across owners",
      });
    });
    schema.systemFunction({
      name: "claim_claims",
      args: { max_rows: "integer" },
      returns: { id: "varchar(33)", owner_id: "varchar(33)" },
      sql: "select c.id, c.owner_id from notes.claims c limit max_rows",
      reason: "the probe worker claims rows across owners",
    });
  }
}

const CLAIMS = compileMigration(ClaimsMigration, { schema: "notes" }).steps.flatMap(
  (step) => step.sql,
);

/** Runs `check` with the claims migration applied, `variant` run after it, and its declarations as a folder. */
async function withSystemAccess(
  variant: readonly string[],
  undo: readonly string[],
  check: (migrationsDirectory: string) => Promise<void>,
): Promise<void> {
  const em = postgres.database.em();
  for (const statement of CLAIMS) if (!statement.startsWith("--")) await em.execute(statement);
  try {
    for (const statement of variant) await em.execute(statement);
    await withMigrations(CLAIMS.map((statement) => `${statement};\n`).join(""), check);
  } finally {
    for (const statement of [
      ...undo,
      'drop function if exists "notes"."claim_claims"(integer)',
      'drop table "notes"."claims"',
      'revoke usage on schema "notes" from "stackra_system_access"',
    ])
      await em.execute(statement);
  }
}

/** Each refused variant of the system-access shape: what it runs, what undoes it, the gap it must raise. */
const REFUSED_ACCESS: readonly (readonly [string, readonly string[], readonly string[], RegExp])[] =
  [
    [
      "a system-access policy to PUBLIC",
      [
        'drop policy "pol_claims_system_access_select" on "notes"."claims"',
        'create policy "pol_claims_system_access_select" on "notes"."claims" for select using (true)',
      ],
      [],
      /pol_claims_system_access_select \(to public\) is not/,
    ],
    [
      "a system-access policy to the service role",
      [
        "do $$ begin create role probe_app nologin; exception when duplicate_object then null; end $$",
        'drop policy "pol_claims_system_access_update" on "notes"."claims"',
        'create policy "pol_claims_system_access_update" on "notes"."claims" for update to probe_app using (true) with check (true)',
      ],
      [],
      /pol_claims_system_access_update \(to probe_app\) is not/,
    ],
    [
      "a function without SECURITY DEFINER",
      ['alter function "notes"."claim_claims"(integer) security invoker'],
      [],
      /claim_claims\(integer\) is owned by stackra_system_access but not SECURITY DEFINER/,
    ],
    [
      "an unpinned search path",
      ['alter function "notes"."claim_claims"(integer) reset search_path'],
      [],
      /claim_claims\(integer\) does not pin search_path=pg_catalog, pg_temp/,
    ],
    [
      "PUBLIC execute",
      ['grant execute on function "notes"."claim_claims"(integer) to public'],
      [],
      /claim_claims\(integer\): PUBLIC may execute it/,
    ],
    [
      "a member of the role",
      ["create role access_member nologin", "grant stackra_system_access to access_member"],
      ["drop role access_member"],
      /role access_member is a member of stackra_system_access/,
    ],
    [
      "a BYPASSRLS role",
      ["alter role stackra_system_access bypassrls"],
      ["alter role stackra_system_access nobypassrls"],
      /role stackra_system_access has BYPASSRLS/,
    ],
    [
      "a column grant beyond the declared columns",
      ['grant select ("body") on "notes"."claims" to stackra_system_access'],
      [],
      /holds SELECT on notes\.claims\.body, which t\.systemAccess does not declare/,
    ],
    [
      "a table-level grant",
      ['grant select on "notes"."claims" to stackra_system_access'],
      [],
      /holds SELECT on all of notes\.claims/,
    ],
  ];

describe("assertRowSecurity", () => {
  it("passes an owned table, seeding a row of each owner itself", async () => {
    await expect(assertRowSecurity(postgres.database, OPTIONS)).resolves.toEqual([]);
    const [left] = (await postgres.database
      .em()
      .execute('select count(*)::int as count from "notes"."notes"')) as { count: number }[];
    expect(left?.count).toBe(0);
  });

  it("warns, with its group, about each unlisted table without the owner column", async () => {
    await withTables(UNOWNED_TABLES, UNOWNED, async () => {
      const warnings = await assertRowSecurity(postgres.database, OPTIONS);
      expect(warnings).toHaveLength(4);
      expect(warnings).toEqual([
        expect.stringMatching(
          /^notes\.ancestors has no owner_id column and is not a platform table \(an ancestor scope_path table awaiting the contract step\)/,
        ),
        expect.stringMatching(
          /^notes\.oddities has no owner_id column and is not a platform table \(unclassified\)/,
        ),
        expect.stringMatching(
          /^notes\.scoped has no owner_id column and is not a platform table \(a scope_id table whose policy reads app\.owner_id; its pol_scoped_scope_id is not exactly the generated equals or equalsOrUnset policy, so it is not group \(b\)\)/,
        ),
        expect.stringMatching(
          /^notes\.tags has no owner_id column and is not a platform table \(a system table with no row-level security, awaiting its ADR decision\)/,
        ),
      ]);
    });
  });

  it("fails each unlisted table without the owner column in strict mode", async () => {
    await withTables(UNOWNED_TABLES, UNOWNED, async () => {
      const audit = assertRowSecurity(postgres.database, { ...OPTIONS, strict: true });
      for (const table of UNOWNED_TABLES)
        await expect(audit).rejects.toThrow(
          new RegExp(`notes\\.${table} has no owner_id column and is not a platform table`),
        );
    });
  });

  it("accepts a listed table, and fails a listing with no reason or of an owned table", async () => {
    await withTables(["tags"], ['create table "notes"."tags" ("id" int primary key)'], async () => {
      const platform = new Map([["notes.tags", "shared labels, not owner data"]]);
      await expect(assertRowSecurity(postgres.database, { ...OPTIONS, platform })).resolves.toEqual(
        [],
      );
      await expect(
        assertRowSecurity(postgres.database, {
          ...OPTIONS,
          platform: new Map([["notes.tags", " "]]),
        }),
      ).rejects.toThrow(/notes\.tags is listed as a platform table with no reason/);
    });
    await expect(
      assertRowSecurity(postgres.database, {
        ...OPTIONS,
        platform: new Map([["notes.notes", "wrongly listed"]]),
      }),
    ).rejects.toThrow(/notes\.notes is listed as a platform table but holds owner_id/);
  });

  it("reports a table without row-level security or its policy", async () => {
    await withTables(
      ["open_notes"],
      ['create table "notes"."open_notes" ("id" int primary key, "owner_id" text)'],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(/notes\.open_notes does not enable row-level security/);
        await expect(audit).rejects.toThrow(
          /notes\.open_notes has no policy pol_open_notes_owner_id/,
        );
      },
    );
  });

  it("reports a second permissive policy and a misnamed restrictive one", async () => {
    await withTables(
      ["wide_notes"],
      [
        ...ownedTable("wide_notes"),
        ownerPolicy("wide_notes"),
        `create policy "pol_wide_notes_kind" on "notes"."wide_notes" for select using ("kind" = 'memo')`,
        `create policy "narrow" on "notes"."wide_notes" as restrictive using (true)`,
      ],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(
          /notes\.wide_notes: pol_wide_notes_kind is a second permissive policy/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.wide_notes: restrictive policy narrow is not named pol_wide_notes_<column>/,
        );
      },
    );
  });

  it("reports a policy that is not the owner equality, and the other owner's seeded row it lets through", async () => {
    await withTables(
      ["leaky_notes"],
      [...ownedTable("leaky_notes"), ownerPolicy("leaky_notes", "true")],
      async () => {
        const audit = assertRowSecurity(postgres.database, OPTIONS);
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: pol_leaky_notes_owner_id is not the owner equality/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: a probe as own_a saw 1 rows of other owners/,
        );
        await expect(audit).rejects.toThrow(
          /notes\.leaky_notes: a probe with app\.owner_id unset saw 2 rows/,
        );
      },
    );
  });

  it("reports an owned table it cannot seed", async () => {
    await withTables(
      ["host_notes"],
      [
        'create table "notes"."host_notes" ("id" inet primary key, "owner_id" text not null)',
        'alter table "notes"."host_notes" enable row level security',
        'alter table "notes"."host_notes" force row level security',
        ownerPolicy("host_notes"),
      ],
      async () => {
        await expect(assertRowSecurity(postgres.database, OPTIONS)).rejects.toThrow(
          /notes\.host_notes: could not seed a row of each probe owner.*no seed value for key id \(inet\)/,
        );
      },
    );
  });

  it("accepts a scope_id table under exactly the generated equality, and probes it by scope_id", async () => {
    await withTables(
      ["limits", "strict_limits"],
      [...scopedTable("limits", "equalsOrUnset"), ...scopedTable("strict_limits", "equals")],
      async () => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, strict: true }),
        ).resolves.toEqual([]);
      },
    );
  });

  it("rejects a looser scope_id policy and a second permissive policy beside the exact one", async () => {
    await withTables(
      ["loose_limits"],
      [
        'create table "notes"."loose_limits" ("id" varchar(33) primary key, "scope_id" varchar(63))',
        'alter table "notes"."loose_limits" enable row level security',
        'alter table "notes"."loose_limits" force row level security',
        `create policy "pol_loose_limits_scope_id" on "notes"."loose_limits" using ("scope_id" is not distinct from nullif(current_setting('app.owner_id', true), '')::varchar(63) or true) with check ("scope_id" is not distinct from nullif(current_setting('app.owner_id', true), '')::varchar(63) or true)`,
      ],
      async () => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, strict: true }),
        ).rejects.toThrow(
          /notes\.loose_limits has no owner_id column and is not a platform table \(a scope_id table whose policy reads app\.owner_id; its pol_loose_limits_scope_id is not exactly the generated/,
        );
      },
    );
    await withTables(
      ["wide_limits"],
      [
        ...scopedTable("wide_limits", "equalsOrUnset"),
        `create policy "pol_wide_limits_id" on "notes"."wide_limits" for select using (true)`,
      ],
      async () => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, strict: true }),
        ).rejects.toThrow(/notes\.wide_limits: pol_wide_limits_id is a second permissive policy/);
      },
    );
  });

  it("reads t.platformTable from the compiled migrations, and refuses it on a table with a scope id", async () => {
    const declare = "-- stackra:platform-table notes.cursors one row per consumer class;\n";
    await withTables(
      ["cursors"],
      ['create table "notes"."cursors" ("consumer" varchar(255) primary key)'],
      async () => {
        await withMigrations(declare, async (migrationsDirectory) => {
          await expect(
            assertRowSecurity(postgres.database, { ...OPTIONS, strict: true, migrationsDirectory }),
          ).resolves.toEqual([]);
        });
      },
    );
    await withTables(
      ["cursors"],
      ['create table "notes"."cursors" ("consumer" varchar(255) primary key, "scope_id" text)'],
      async () => {
        await withMigrations(declare, async (migrationsDirectory) => {
          await expect(
            assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
          ).rejects.toThrow(
            /notes\.cursors is declared a platform table \(t\.platformTable\) but holds scope_id/,
          );
        });
      },
    );
    await withTables(["cursors"], [...ownedTable("cursors"), ownerPolicy("cursors")], async () => {
      await withMigrations(declare, async (migrationsDirectory) => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
        ).rejects.toThrow(/notes\.cursors is listed as a platform table but holds owner_id/);
      });
    });
  });

  it("holds a t.reviewedPolicy table to forced row-level security and its named policies", async () => {
    const routes = [
      'create table "notes"."routes" ("id" varchar(33) primary key, "scope_id" varchar(63) not null)',
      'alter table "notes"."routes" enable row level security',
      `create policy "pol_routes_read" on "notes"."routes" for select using (current_setting('notes.route_read', true) = 'on')`,
    ];
    const review =
      "-- stackra:reviewed-policy notes.routes pol_routes_read a pre-tenant route read;\n";
    await withTables(
      ["routes"],
      [...routes, 'alter table "notes"."routes" force row level security'],
      async () => {
        await withMigrations(review, async (migrationsDirectory) => {
          await expect(
            assertRowSecurity(postgres.database, { ...OPTIONS, strict: true, migrationsDirectory }),
          ).resolves.toEqual([]);
        });
        await withMigrations(
          "-- stackra:reviewed-policy notes.routes pol_routes_read,pol_routes_write a pre-tenant route;\n",
          async (migrationsDirectory) => {
            await expect(
              assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
            ).rejects.toThrow(
              /notes\.routes: t\.reviewedPolicy names pol_routes_write, which the table does not have/,
            );
          },
        );
        await withMigrations(
          `${review}-- stackra:platform-table notes.routes no tenant data;\n`,
          async (migrationsDirectory) => {
            await expect(
              assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
            ).rejects.toThrow(
              /notes\.routes is declared both a platform table and a reviewed policy/,
            );
          },
        );
      },
    );
    await withTables(["routes"], routes, async () => {
      await withMigrations(review, async (migrationsDirectory) => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
        ).rejects.toThrow(
          /notes\.routes is a reviewed policy table but does not force row-level security/,
        );
      });
    });
  });

  it("reports a role that bypasses row-level security", async () => {
    await postgres.database.em().execute('create role "bypass_app" nologin bypassrls');
    await expect(
      assertRowSecurity(postgres.database, { ...OPTIONS, role: "bypass_app" }),
    ).rejects.toThrow(/role bypass_app has BYPASSRLS/);
  });

  describe("system access (ADR 0239 amendment, gap A)", () => {
    it("passes a declared t.systemAccess table and its schema.systemFunction, in strict mode", async () => {
      await withSystemAccess([], [], async (migrationsDirectory) => {
        await expect(
          assertRowSecurity(postgres.database, { ...OPTIONS, strict: true, migrationsDirectory }),
        ).resolves.toEqual([]);
      });
    });

    it("refuses undeclared system access", async () => {
      await withSystemAccess([], [], async () => {
        await expect(assertRowSecurity(postgres.database, OPTIONS)).rejects.toThrow(
          /pol_claims_system_access_select without a t\.systemAccess declaration/,
        );
      });
    });

    for (const [name, variant, undo, gap] of REFUSED_ACCESS)
      it(`refuses ${name}`, async () => {
        await withSystemAccess(variant, undo, async (migrationsDirectory) => {
          await expect(
            assertRowSecurity(postgres.database, { ...OPTIONS, migrationsDirectory }),
          ).rejects.toThrow(gap);
        });
      });
  });
});
