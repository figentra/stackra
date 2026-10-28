/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateLegalHoldsMigration`: one transactional step that creates `privacy.legal_holds` (keyed
 *          by id, with the live-hold index) and `privacy.legal_hold_refusals`, each under a forced policy on the
 *          session's tenant partition.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0134 (holds); ADR 0159 (as amended); data-layer gap gov20.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateLegalHoldsMigration } from "#node/database/migrations/0002-create-legal-holds.migration";

describe("CreateLegalHoldsMigration", () => {
  const { steps } = compileMigration(CreateLegalHoldsMigration, { schema: "privacy" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the holds table with its live-hold index, and the refusal log", () => {
    expect(sql).toContain('create table "privacy"."legal_holds"');
    expect(sql).toContain('primary key ("id")');
    expect(sql).toContain('"released_at" timestamptz null');
    expect(sql).toContain("where released_at is null");
    expect(sql).toContain('create table "privacy"."legal_hold_refusals"');
  });

  it("forces the tenant-partition policy on both tables", () => {
    for (const table of ["legal_holds", "legal_hold_refusals"]) {
      expect(sql).toContain(`alter table "privacy"."${table}" force row level security`);
      expect(sql).toContain(
        `create policy "pol_${table}_scope_id" on "privacy"."${table}" using ("scope_id" = coalesce(nullif(current_setting('app.tenant_id', true), ''), '-'))`,
      );
    }
  });
});
