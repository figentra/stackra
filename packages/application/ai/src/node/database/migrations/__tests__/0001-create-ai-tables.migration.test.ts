/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAiTablesMigration`: it compiles (every column states its nullability and a comment) to
 *          one transactional step that creates the eight tables of ADR 0100 decision 10 in the `ai` schema, each under
 *          the forced tenant equality policy, with sealed message content, hashed tool-call input, the unique approval
 *          id and the embedding's vector column.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro installed, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0100 (decision 10); ADR 0159 (as amended); ADR 0239; ADR 0399.
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { CreateAiTablesMigration } from "#node/database/migrations/0001-create-ai-tables.migration";

const TABLES = [
  "conversations",
  "messages",
  "runs",
  "steps",
  "tool_calls",
  "approvals",
  "embeddings",
  "a2a_tasks",
];

describe("CreateAiTablesMigration", () => {
  const { steps } = compileMigration(CreateAiTablesMigration, {
    schema: "ai",
    createsSchema: true,
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates every ADR 0100 table under the tenant policy", () => {
    for (const table of TABLES) {
      expect(sql).toContain(`create table "ai"."${table}"`);
      expect(sql).toContain(`create policy "pol_${table}_tenant_id"`);
    }
  });

  it("keeps text sealed and inputs hashed", () => {
    expect(sql).toContain('"content" text not null');
    expect(sql).toContain('"input_hash" varchar(64) not null');
    expect(sql).toContain('create unique index "idx_approvals_approval_id"');
    expect(sql).toContain('create unique index "idx_messages_conversation_id_position"');
  });

  it("adds the embedding's vector column", () => {
    expect(sql).toContain('alter table "ai"."embeddings" add column "embedding" vector not null');
  });
});
