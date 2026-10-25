/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRunVersionMigration`: it adds a non-null `version` column defaulting to 1 to
 *          `workflow.runs`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0152 (decision 2); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddRunVersionMigration } from "#node/database/migrations/0002-add-run-version.migration";

describe("AddRunVersionMigration", () => {
  it("adds the pinned version, 1 for existing runs", () => {
    const sql = compileMigration(AddRunVersionMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."runs"');
    expect(sql).toMatch(/"version" integer not null default 1/);
  });
});
