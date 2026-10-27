/**
 * Stackra file contract:
 * Purpose: unit tests of `AddServiceAckKeptMigration`: it adds the NOT NULL `kept` jsonb, defaulted to `{}`, to
 *          `workflow.service_ack_sets`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0210 (decision 6); STA-1312; ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddServiceAckKeptMigration } from "#node/database/migrations/0008-add-service-ack-kept.migration";

describe("AddServiceAckKeptMigration", () => {
  it("adds what each service kept, defaulted to nothing", () => {
    const sql = compileMigration(AddServiceAckKeptMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."service_ack_sets"');
    expect(sql).toContain(`"kept" jsonb default '{}'::jsonb not null`);
  });
});
