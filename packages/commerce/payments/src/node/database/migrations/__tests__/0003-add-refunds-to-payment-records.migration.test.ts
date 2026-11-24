/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRefundsToPaymentRecordsMigration`: one transactional step that adds a nullable jsonb `refunds`
 *          column to the payment records and touches nothing else.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddRefundsToPaymentRecordsMigration } from "#node/database/migrations/0003-add-refunds-to-payment-records.migration";

describe("AddRefundsToPaymentRecordsMigration", () => {
  const { steps } = compileMigration(AddRefundsToPaymentRecordsMigration, { schema: "payments" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("adds one nullable jsonb column and nothing else", () => {
    expect(sql).toContain('alter table "payments"."payment_records"');
    expect(sql).toContain('"refunds" jsonb');
    expect(sql).not.toContain("not null");
    expect(sql).not.toContain("create table");
    expect(sql).not.toContain("row level security");
  });
});
