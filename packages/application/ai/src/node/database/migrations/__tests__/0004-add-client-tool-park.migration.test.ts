/**
 * Stackra file contract:
 * Purpose: unit tests of `AddClientToolParkMigration`: it adds the three nullable client park columns to `ai.runs`,
 *          widens the run status and tool call outcome checks, and states 0001's checks back as the inverses.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); ADR 0490 (decision 4).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddClientToolParkMigration } from "#node/database/migrations/0004-add-client-tool-park.migration";

describe("AddClientToolParkMigration", () => {
  const { steps } = compileMigration(AddClientToolParkMigration, { schema: "ai" });
  const sql = steps.flatMap((step) => step.sql).join("\n");
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse)).join("\n");

  it("adds the park columns, all nullable", () => {
    expect(sql).toContain('"ai"."runs"');
    expect(sql).toMatch(/"pending_surface_id" varchar\(64\) null/);
    expect(sql).toMatch(/"pending_tool" varchar\(160\) null/);
    expect(sql).toMatch(/"pending_expires_at" timestamptz null/);
  });

  it("widens the status and outcome checks", () => {
    expect(sql).toContain("'waiting_client_tool'");
    expect(sql).toContain("'client_tool'");
    expect(sql).toContain('"ck_runs_status"');
    expect(sql).toContain('"ck_tool_calls_outcome"');
  });

  it("restores the 0001 checks as the inverse", () => {
    expect(inverse).toContain("'waiting_approval', 'completed', 'failed'");
    expect(inverse).not.toContain("'waiting_client_tool'");
    expect(inverse).not.toContain("'client_tool'");
  });
});
