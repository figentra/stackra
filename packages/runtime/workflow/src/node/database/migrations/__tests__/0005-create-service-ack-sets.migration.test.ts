/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateServiceAckSetsMigration`: `workflow.service_ack_sets` with its versioned row, its
 *          unique subject and no row-level-security policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0427 (decision 1); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateServiceAckSetsMigration } from "#node/database/migrations/0005-create-service-ack-sets.migration";

describe("CreateServiceAckSetsMigration", () => {
  it("creates the versioned ack sets, one per subject, without a scope policy", () => {
    const sql = compileMigration(CreateServiceAckSetsMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."service_ack_sets"');
    expect(sql).toContain('"subject" varchar(255) not null');
    expect(sql).toContain('"version" integer default 1 not null');
    expect(sql).toMatch(/"completed_at" timestamptz null/);
    expect(sql).not.toMatch(/row level security/i);
  });
});
