/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateRevisionsMigration`: it compiles to one transactional step that creates
 *          `content.revisions` with its public id key, scope columns, number, snapshot and nullable publish time, the
 *          unique index on model, record and number, and the forced scope policy, in the existing schema.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0321 (decision 2); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateRevisionsMigration } from "#node/database/migrations/0002-create-revisions.migration";

describe("CreateRevisionsMigration", () => {
  const { after, steps } = compileMigration(CreateRevisionsMigration, { schema: "content" });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the revisions table with its columns", () => {
    expect(sql).toContain('create table "content"."revisions"');
    expect(sql).toContain('"record_id" varchar(33) not null');
    expect(sql).toContain('"number" integer not null');
    expect(sql).toContain('"data" jsonb not null');
    expect(sql).toContain('"published_at" timestamptz null');
    expect(sql).toContain('"idx_revisions_model_record_id_number"');
  });

  it("forces the scope policy", () => {
    expect(sql).toContain('alter table "content"."revisions" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});
