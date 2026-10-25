/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRevisionScheduleMigration`: two nullable columns in the transactional step and the
 *          index built concurrently on its own.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159; ADR 0321 (decision 6).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddRevisionScheduleMigration } from "#node/database/migrations/0003-add-revision-schedule.migration";

describe("AddRevisionScheduleMigration", () => {
  it("adds the schedule columns and an online index", () => {
    const [step, index] = compileMigration(AddRevisionScheduleMigration, {
      schema: "content",
    }).steps;
    expect(step?.sql).toContain(
      'alter table "content"."revisions" add column "scheduled_at" timestamptz null',
    );
    expect(step?.sql.join("\n")).toContain('"campaign" varchar(64) null');
    expect(index?.transactional).toBe(false);
    expect(index?.sql[0]).toMatch(/create index concurrently/);
  });
});
