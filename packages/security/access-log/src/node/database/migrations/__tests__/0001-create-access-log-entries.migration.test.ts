/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAccessLogEntriesMigration`: it compiles (every column states its nullability and a
 *          comment) to one transactional step that creates `access_log.access_log_entries` with the `acl` key, the
 *          tenant column under its forced equality policy, the hash-chain columns and their unique (tenant, sequence)
 *          index, and the trigger that refuses an UPDATE, each raw statement with its inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0212 (decision 3); ADR 0239; ADR 0231.
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { DataClassificationMacro } from "#node/database/macros/data-classification.macro";
import { CreateAccessLogEntriesMigration } from "#node/database/migrations/0001-create-access-log-entries.migration";

describe("CreateAccessLogEntriesMigration", () => {
  const { after, steps } = compileMigration(CreateAccessLogEntriesMigration, {
    schema: "access_log",
    createsSchema: true,
    macros: [BelongsToTenantMacro, DataClassificationMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");
  const inverse = steps.flatMap((step) => step.inverse).join("\n");

  it("is one transactional step that names no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with every column stated and commented", () => {
    expect(sql).toContain('create table "access_log"."access_log_entries"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"tenant_id" varchar(33) not null');
    expect(sql).toContain('"call_id" varchar(64) not null');
    expect(sql).toContain('"target" varchar(200) not null');
    expect(sql).toContain('"classification" text not null constraint');
    expect(sql).toContain('"actor" jsonb not null');
    expect(sql).toContain('"subjects" jsonb not null');
    expect(sql).toContain('"at" timestamptz not null');
    expect(sql).toContain('"sequence" integer not null');
    expect(sql).toContain('"previous_hash" varchar(64) not null');
    expect(sql).toContain('"hash" varchar(64) not null');
    expect(sql).toContain(
      'comment on column "access_log"."access_log_entries"."hash" is \'SHA-256 of the previous hash',
    );
  });

  it("keeps each tenant's chain linear under the forced equality policy", () => {
    expect(sql).toContain(
      'create unique index "idx_access_log_entries_tenant_id_sequence" on "access_log"."access_log_entries"',
    );
    expect(sql).toContain('"idx_access_log_entries_tenant_id_call_id"');
    expect(sql).toContain('"idx_access_log_entries_at"');
    expect(sql).toContain('alter table "access_log"."access_log_entries" force row level security');
    expect(sql).toContain('create policy "pol_access_log_entries_tenant_id"');
  });

  it("refuses an UPDATE through a trigger, with the inverse of each raw statement", () => {
    expect(sql).toContain('create function "access_log"."refuse_update"() returns trigger');
    expect(sql).toContain(
      'create trigger "trg_access_log_entries_refuse_update" before update on "access_log"."access_log_entries"',
    );
    expect(inverse).toContain(
      'drop trigger if exists "trg_access_log_entries_refuse_update" on "access_log"."access_log_entries"',
    );
    expect(inverse).toContain('drop function if exists "access_log"."refuse_update"()');
  });
});
