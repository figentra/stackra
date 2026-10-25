/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSegmentsMigration`: it compiles to one transactional step that creates the `ltree`
 *          extension, `segments.segments` with its kind check and nullable rule set link, and
 *          `segments.segment_memberships` with its cascading segment key and one row per segment and subject, both
 *          under the forced scope policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0332 (decisions 1 to 3); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSegmentsMigration } from "#node/database/migrations/0001-create-segments.migration";

describe("CreateSegmentsMigration", () => {
  const { after, steps } = compileMigration(CreateSegmentsMigration, {
    schema: "segments",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the segment table with its kind check and rule set link", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "segments"."segments"');
    expect(sql).toContain('"subject_model" varchar(127) not null');
    expect(sql).toContain(`check ("kind" in ('dynamic', 'manual'))`);
    expect(sql).toContain('"rule_set_id" varchar(33) null');
    expect(sql).toContain('"idx_segments_subject_model_kind"');
  });

  it("creates the membership table, one row per segment and subject, deleted with its segment", () => {
    expect(sql).toContain('create table "segments"."segment_memberships"');
    expect(sql).toContain('"subject_id" varchar(33) not null');
    expect(sql).toContain(
      'create unique index "idx_segment_memberships_segment_id_subject_id" on "segments"."segment_memberships" ("segment_id", "subject_id")',
    );
    expect(sql).toContain('references "segments"."segments" ("id") on delete cascade');
    expect(sql).toContain('"idx_segment_memberships_subject_model_subject_id"');
  });

  it("forces the scope policy on both tables", () => {
    expect(sql).toContain('alter table "segments"."segments" force row level security');
    expect(sql).toContain('alter table "segments"."segment_memberships" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
  });
});
