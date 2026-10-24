/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateStoredSettingsMigration`: one transactional step that creates the `ltree` extension and
 *          `settings.stored_settings` with the `sst` primary key, the nullable node and user holder columns, the
 *          GiST-indexed path, the `jsonb` values and locks, one unique index per holder kind, and no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decisions 3 and 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateStoredSettingsMigration } from "#node/database/migrations/0001-create-stored-settings.migration";

describe("CreateStoredSettingsMigration", () => {
  const { after, steps } = compileMigration(CreateStoredSettingsMigration, {
    schema: "settings",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the extension and the table with its columns", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "settings"."stored_settings"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"group_key" varchar(63) not null');
    expect(sql).toContain('"scope_id" varchar(33)');
    expect(sql).toContain('"scope_path" ltree');
    expect(sql).toContain('"user_id" varchar(33)');
    expect(sql).toContain('"values" jsonb not null');
    expect(sql).toContain('"locked" jsonb not null');
  });

  it("indexes the path with GiST and each holder kind uniquely, with no policy", () => {
    expect(sql).toContain('using gist ("scope_path")');
    expect(sql).toContain("idx_stored_settings_group_key_scope_id");
    expect(sql).toContain("idx_stored_settings_group_key_user_id");
    expect(sql).not.toContain("row level security");
  });
});
