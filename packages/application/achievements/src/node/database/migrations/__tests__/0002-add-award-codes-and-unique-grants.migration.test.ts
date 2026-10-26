/**
 * Stackra file contract:
 * Purpose: unit tests of `AddAwardCodesAndUniqueGrantsMigration`: it adds the two nullable code columns, a unique code
 *          hash and the partial unique index of live awards per kind, recipient and period, both indexes built online.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0432 (decisions 2 and 3); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddAwardCodesAndUniqueGrantsMigration } from "#node/database/migrations/0002-add-award-codes-and-unique-grants.migration";

describe("AddAwardCodesAndUniqueGrantsMigration", () => {
  const { steps } = compileMigration(AddAwardCodesAndUniqueGrantsMigration, {
    schema: "achievements",
    createsSchema: false,
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("adds the code columns", () => {
    expect(sql).toContain('"verify_code" varchar(14) null');
    expect(sql).toContain('"code_hash" varchar(64) null');
    expect(sql).toContain('"idx_award_verifications_code_hash"');
  });

  it("builds both indexes online, outside the transaction", () => {
    const online = steps.filter((step) => !step.transactional).flatMap((step) => step.sql);
    expect(online).toHaveLength(2);
    expect(
      online.every((statement) => statement.includes("create unique index concurrently")),
    ).toBe(true);
  });

  it("makes a live period grant unique per kind and recipient", () => {
    expect(sql).toContain('"idx_awards_kind_id_recipient_id_period"');
    expect(sql).toContain("where revoked_at is null and period is not null");
  });
});
