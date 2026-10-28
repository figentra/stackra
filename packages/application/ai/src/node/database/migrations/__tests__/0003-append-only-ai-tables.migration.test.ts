/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnlyAiTablesMigration`: it revokes `UPDATE` on `ai.messages`, `ai.steps` and
 *          `ai.tool_calls` from `public` and the migrating role, with the grant back as the inverse, and leaves runs and
 *          approvals alone.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-1413.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AppendOnlyAiTablesMigration } from "#node/database/migrations/0003-append-only-ai-tables.migration";

describe("AppendOnlyAiTablesMigration", () => {
  const { steps } = compileMigration(AppendOnlyAiTablesMigration, { schema: "ai" });
  const sql = steps.flatMap((step) => step.sql);
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse));

  it("revokes update on the three append-only tables, and only those", () => {
    expect(sql).toEqual([
      'revoke update on "ai"."messages" from public, current_user',
      'revoke update on "ai"."steps" from public, current_user',
      'revoke update on "ai"."tool_calls" from public, current_user',
    ]);
  });

  it("grants update back as the inverse", () => {
    for (const table of ["messages", "steps", "tool_calls"])
      expect(inverse).toContain(`grant update on "ai"."${table}" to current_user`);
  });
});
