/**
 * Stackra file contract:
 * Purpose: integration tests of `assertRowSecurity` on a real Postgres: a table under forced row-level security
 *          with its `pol_<table>_<column>` policy passes, with a seeded row of each owner; a table without it is
 *          reported, and so is a role that bypasses row-level security.
 * Boundary: test only; integration tier (Docker through `usePostgres`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (integration tier); ADR 0239 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { assertRowSecurity } from "#testing/functions/assert-row-security.function";
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
            'create schema "notes"',
            'create table "notes"."notes" ("id" int primary key, "owner_id" text not null)',
            'alter table "notes"."notes" enable row level security',
            'alter table "notes"."notes" force row level security',
            `create policy "pol_notes_owner_id" on "notes"."notes" using ("owner_id" = current_setting('app.owner_id'))`,
            `insert into "notes"."notes" values (1, 'a'), (2, 'b')`,
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
  probe: ["a", "b"],
} as const;

describe("assertRowSecurity", () => {
  it("passes a table under forced row-level security with its policy", async () => {
    await expect(assertRowSecurity(postgres.database, OPTIONS)).resolves.toBeUndefined();
  });

  it("reports a table without row-level security", async () => {
    await postgres.database
      .em()
      .execute('create table "notes"."open_notes" ("id" int primary key, "owner_id" text)');
    await expect(assertRowSecurity(postgres.database, OPTIONS)).rejects.toThrow(
      /notes\.open_notes does not enable row-level security/,
    );
    await postgres.database.em().execute('drop table "notes"."open_notes"');
  });

  it("reports a role that bypasses row-level security", async () => {
    await postgres.database.em().execute('create role "bypass_app" nologin bypassrls');
    await expect(
      assertRowSecurity(postgres.database, { ...OPTIONS, role: "bypass_app" }),
    ).rejects.toThrow(/role bypass_app has BYPASSRLS/);
  });
});
