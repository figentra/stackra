/**
 * Stackra file contract:
 * Purpose: unit tests of `AddIdempotencyRefusalMigration`: `idempotency_keys` gains one nullable jsonb `refusal`
 *          column with no default.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-2532.
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { AddIdempotencyRefusalMigration } from "#node/database/migrations/0008-add-idempotency-refusal.migration";

describe("AddIdempotencyRefusalMigration", () => {
  it("adds a nullable jsonb refusal column without a default", () => {
    const sql = compileMigration(AddIdempotencyRefusalMigration, { schema: "database" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain(
      'alter table "database"."idempotency_keys" add column "refusal" jsonb null',
    );
    expect(sql).not.toContain("default");
  });
});
