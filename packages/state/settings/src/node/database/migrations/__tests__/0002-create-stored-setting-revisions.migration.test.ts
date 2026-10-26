/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateStoredSettingRevisionsMigration`: one transactional step that creates
 *          `settings.stored_setting_revisions` with the `ssr` key, the holder columns, the change and audit columns and
 *          the history and due indexes.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0213 (decision 5); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateStoredSettingRevisionsMigration } from "#node/database/migrations/0002-create-stored-setting-revisions.migration";

describe("CreateStoredSettingRevisionsMigration", () => {
  const { steps } = compileMigration(CreateStoredSettingRevisionsMigration, { schema: "settings" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with its columns and indexes", () => {
    expect(sql).toContain('create table "settings"."stored_setting_revisions"');
    expect(sql).toContain('"group_key" varchar(63) not null');
    expect(sql).toContain(`"values" jsonb default '{}'::jsonb not null`);
    expect(sql).toContain('"locked" jsonb');
    expect(sql).toContain('"break_glass" boolean default false not null');
    expect(sql).toContain('"status" varchar(16) not null');
    expect(sql).toContain('"effective_at"');
    expect(sql).toContain('"status", "effective_at"');
  });
});
