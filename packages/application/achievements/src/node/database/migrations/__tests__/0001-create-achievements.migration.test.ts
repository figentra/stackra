/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAchievementsMigration`: it compiles to one transactional step that creates the `ltree`
 *          extension, `achievements.award_kinds` (unique key per scope), `achievements.awards` (kind key, recipient
 *          index) under the forced scope policy, and `achievements.award_verifications` (unique hash, cascading award
 *          key) with no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0368 (decisions 1 to 5); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateAchievementsMigration } from "#node/database/migrations/0001-create-achievements.migration";

describe("CreateAchievementsMigration", () => {
  const { after, steps } = compileMigration(CreateAchievementsMigration, {
    schema: "achievements",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the kind table, one key per scope, with its flags and criteria link", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "achievements"."award_kinds"');
    expect(sql).toContain('"idx_award_kinds_scope_id_key"');
    expect(sql).toContain('"levels" jsonb not null');
    expect(sql).toContain('"is_once_per_period" boolean not null');
    expect(sql).toContain('"rule_set_id" varchar(33) null');
  });

  it("creates the award table linked to its kind", () => {
    expect(sql).toContain('create table "achievements"."awards"');
    expect(sql).toContain('references "achievements"."award_kinds" ("id")');
    expect(sql).toContain('"verify_token" varchar(64) not null');
    expect(sql).toContain('"idx_awards_recipient_model_recipient_id"');
  });

  it("creates the verification index, unique per hash and deleted with its award", () => {
    expect(sql).toContain('create table "achievements"."award_verifications"');
    expect(sql).toContain('"idx_award_verifications_token_hash"');
    expect(sql).toContain('references "achievements"."awards" ("id") on delete cascade');
  });

  it("forces the scope policy on kinds and awards only", () => {
    expect(sql).toContain('alter table "achievements"."award_kinds" force row level security');
    expect(sql).toContain('alter table "achievements"."awards" force row level security');
    expect(sql).not.toContain(
      'alter table "achievements"."award_verifications" force row level security',
    );
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});
