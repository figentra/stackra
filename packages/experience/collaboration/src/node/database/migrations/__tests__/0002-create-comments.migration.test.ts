/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateCommentsMigration`: one transactional step creating the four comment tables, their
 *          links and indexes, each under the forced scope policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0433 (decisions 1 to 3); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateCommentsMigration } from "#node/database/migrations/0002-create-comments.migration";

describe("CreateCommentsMigration", () => {
  const { steps } = compileMigration(CreateCommentsMigration, {
    schema: "collaboration",
    createsSchema: false,
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the four tables with their links and indexes", () => {
    for (const table of ["comment_threads", "comments", "comment_revisions", "comment_mentions"])
      expect(sql).toContain(`create table "collaboration"."${table}"`);
    expect(sql).toContain('references "collaboration"."comment_threads" ("id")');
    expect(sql).toContain('references "collaboration"."comments" ("id") on delete cascade');
    expect(sql).toContain('"idx_comment_threads_record_model_record_id"');
    expect(sql).toContain('"idx_comment_mentions_kind_target_id"');
  });

  it("forces the scope policy on every table", () => {
    for (const table of ["comment_threads", "comments", "comment_revisions", "comment_mentions"])
      expect(sql).toContain(`alter table "collaboration"."${table}" force row level security`);
  });
});
