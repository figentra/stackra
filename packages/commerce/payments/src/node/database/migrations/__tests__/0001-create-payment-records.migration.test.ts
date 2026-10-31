/**
 * Stackra file contract:
 * Purpose: unit tests of `CreatePaymentRecordsMigration`: one transactional step that creates
 *          `payments.payment_records` with money columns, under the forced generated policy on the session's tenant
 *          (null for no tenant), with one record per reference per partition.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0239; STA-1706.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreatePaymentRecordsMigration } from "#node/database/migrations/0001-create-payment-records.migration";

describe("CreatePaymentRecordsMigration", () => {
  const { steps } = compileMigration(CreatePaymentRecordsMigration, { schema: "payments" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with money columns, one record per reference per partition", () => {
    expect(sql).toContain('create table "payments"."payment_records"');
    expect(sql).toContain('"amount_minor" bigint');
    expect(sql).toContain('"refunded_currency" char(3)');
    expect(sql).toContain("((coalesce(scope_id, '-')), reference)");
  });

  it("forces the tenant policy, a null scope for a session in no tenant", () => {
    expect(sql).toContain('alter table "payments"."payment_records" force row level security');
    expect(sql).toContain(
      `"scope_id" is not distinct from nullif(current_setting('app.tenant_id', true), '')`,
    );
  });
});
