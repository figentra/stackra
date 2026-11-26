/**
 * Stackra file contract:
 * Purpose: integration test of the payments package's row security under the strict `assertRowSecurity` audit:
 *          `payment_records`, `connected_account_limits` and `connected_account_limit_changes` keep the tenant in
 *          `scope_id` under the `equalsOrUnset` policy `Blueprint.rowLevelSecurity` writes on `app.tenant_id`, which the
 *          audit accepts as group (b) by shape (ADR 0239 amendment, item 3) and probes by `scope_id`: no warning, no
 *          gap, and the two-tenant probe sees and moves nothing of the other tenant's.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0001 and 0002 migrations create
 *           the tables. The audit's column, setting and probe values are the tenancy package's, written out here
 *           because payments does not depend on @stackra/tenancy.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, items 3 and 7, group
 *                     (c)); ADR 0347 (decision 5).
 */
import { compileMigration } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreatePaymentRecordsMigration } from "#node/database/migrations/0001-create-payment-records.migration";
import { CreateConnectedAccountLimitsMigration } from "#node/database/migrations/0002-create-connected-account-limits.migration";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreatePaymentRecordsMigration, { schema: "payments", createsSchema: true }),
    compileMigration(CreateConnectedAccountLimitsMigration, { schema: "payments" }),
  ],
});

describe("the payments tables' row security", () => {
  it("passes the strict audit, each table owned by its scope_id equality (group (b) by shape)", async () => {
    await expect(
      assertRowSecurity(postgres.database, {
        column: "tenant_id",
        setting: "app.tenant_id",
        role: "payments_app",
        probe: ["scp_01jab3k4m5n6p7q8r9s0t1v2w3", "scp_01jab3k4m5n6p7q8r9s0t1v2w4"],
        strict: true,
      }),
    ).resolves.toEqual([]);
  });
});
