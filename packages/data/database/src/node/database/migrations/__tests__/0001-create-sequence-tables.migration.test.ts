/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSequenceTablesMigration`: one transactional step that creates the `ltree` extension
 *          and the counter, block and void tables in the `database` schema, each with its key columns, scope columns
 *          and the forced ancestor policy on `app.scope_paths`; the counter and void tables are keyed by sequence,
 *          scope, series and period (and the first number), and the block table indexes its returned remainders. No
 *          Postgres `SEQUENCE`.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0342 (decisions 2 to 5); ADR 0159 (as amended); ADR 0327 (decisions 3 and 9); ADR 0022;
 *                     ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { CreateSequenceTablesMigration } from "#node/database/migrations/0001-create-sequence-tables.migration";

describe("CreateSequenceTablesMigration", () => {
  const { after, steps } = compileMigration(CreateSequenceTablesMigration, {
    schema: "database",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
    expect(sql).toContain("ltree");
    expect(sql).not.toMatch(/create sequence/i);
  });

  it("keys each counter by sequence, scope, series and period", () => {
    expect(sql).toContain('create table "database"."sequence_counters"');
    expect(sql).toContain('"last_number" integer default 0 not null');
    expect(sql).toContain('primary key ("sequence_key", "scope_id", "series", "period")');
  });

  it("records blocks with their holder and indexes the returned remainders", () => {
    expect(sql).toContain('create table "database"."sequence_blocks"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"holder" varchar(63)');
    expect(sql).toContain('"issued_through" integer not null');
    expect(sql).toContain("idx_sequence_blocks_sequence_key_scope_id_series_period");
    expect(sql).toContain("where holder is null");
  });

  it("keeps each voided range with its reason and block", () => {
    expect(sql).toContain('create table "database"."sequence_voids"');
    expect(sql).toContain('"reason" varchar(500) not null');
    expect(sql).toContain("fk_sequence_voids_block_id");
    expect(sql).toContain(
      'primary key ("sequence_key", "scope_id", "series", "period", "first_number")',
    );
  });

  it("forces the ancestor policy on every table", () => {
    for (const table of ["sequence_counters", "sequence_blocks", "sequence_voids"]) {
      expect(sql).toContain(`alter table "database"."${table}" force row level security`);
      expect(sql).toContain(`"pol_${table}_scope_path"`);
    }
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});
