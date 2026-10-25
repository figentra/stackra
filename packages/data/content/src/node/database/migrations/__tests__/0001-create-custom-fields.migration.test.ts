/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateCustomFieldsMigration`: it compiles to one transactional step that creates the `ltree`
 *          extension, `content.custom_fields` and `content.custom_field_value_sets` with their public id keys, scope
 *          columns, unique indexes and forced scope policies, and a text `type` with no check constraint.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateCustomFieldsMigration } from "#node/database/migrations/0001-create-custom-fields.migration";

describe("CreateCustomFieldsMigration", () => {
  const { after, steps } = compileMigration(CreateCustomFieldsMigration, {
    schema: "content",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the definition table with its columns", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "content"."custom_fields"');
    expect(sql).toContain('"key" varchar(63) not null');
    expect(sql).toContain('"type" varchar(31) not null');
    expect(sql).toContain('"label" jsonb not null');
    expect(sql).toContain('"required" boolean default false not null');
    expect(sql).toContain(`"rules" jsonb default '{}'::jsonb not null`);
    expect(sql).not.toContain("ck_custom_fields_type");
    expect(sql).toContain('"idx_custom_fields_scope_id_model_key"');
  });

  it("creates the value table, one row per record", () => {
    expect(sql).toContain('create table "content"."custom_field_value_sets"');
    expect(sql).toContain('"record_id" varchar(33) not null');
    expect(sql).toContain(`"values" jsonb default '{}'::jsonb not null`);
    expect(sql).toContain('"idx_custom_field_value_sets_model_record_id"');
  });

  it("forces the scope policy on both tables", () => {
    expect(sql).toContain('alter table "content"."custom_fields" force row level security');
    expect(sql).toContain(
      'alter table "content"."custom_field_value_sets" force row level security',
    );
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
    expect(sql).toContain('using gist ("scope_path")');
  });
});
