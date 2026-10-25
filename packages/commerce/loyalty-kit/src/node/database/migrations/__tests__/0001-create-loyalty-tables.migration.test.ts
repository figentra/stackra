/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateLoyaltyTablesMigration`: it compiles (every column states its nullability and a
 *          comment) to one transactional step that creates both tables under the forced equality policy, with the
 *          account's search columns, the filter and live-member indexes, the entries' nullable account foreign key with
 *          no index, and the entries' idempotency index.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy and search macros installed, no
 *           database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0221; ADR 0239; ADR 0231.
 */
import { compileMigration } from "@stackra/database";
import { SearchableMacro } from "@stackra/search/node";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { CreateLoyaltyTablesMigration } from "#node/database/migrations/0001-create-loyalty-tables.migration";

describe("CreateLoyaltyTablesMigration", () => {
  const { steps } = compileMigration(CreateLoyaltyTablesMigration, {
    schema: "loyalty_kit",
    createsSchema: true,
    macros: [BelongsToTenantMacro, SearchableMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the accounts with every column stated, the search columns and the indexes", () => {
    expect(sql).toContain('create table "loyalty_kit"."loyalty_accounts"');
    expect(sql).toContain('"member_id" varchar(64) not null');
    expect(sql).toContain('"is_frozen" boolean not null');
    expect(sql).toContain('"frozen_at" timestamptz null');
    expect(sql).toContain('"notes" jsonb not null');
    expect(sql).toContain('"search_vector" tsvector null');
    expect(sql).toContain('"idx_loyalty_accounts_search_vector"');
    expect(sql).toContain('"idx_loyalty_accounts_tenant_id_tier"');
    expect(sql).toContain(
      'create unique index "idx_loyalty_accounts_tenant_id_member_id" on "loyalty_kit"."loyalty_accounts" ("tenant_id", "member_id") where deleted_at is null',
    );
    expect(sql).toContain(
      `comment on column "loyalty_kit"."loyalty_accounts"."is_frozen" is 'Frozen accounts earn and redeem nothing`,
    );
  });

  it("creates the entries with the nullable account key and the idempotency index", () => {
    expect(sql).toContain('create table "loyalty_kit"."ledger_entries"');
    expect(sql).toContain('"account_id" varchar(33) null');
    expect(sql).toContain('"fk_ledger_entries_account_id"');
    expect(sql).not.toContain('"idx_ledger_entries_account_id"');
    expect(sql).toContain('"points" integer not null');
    expect(sql).toContain(
      'create unique index "idx_ledger_entries_tenant_id_member_id_reference" on "loyalty_kit"."ledger_entries"',
    );
  });

  it("forces the equality policy on both tables", () => {
    expect(sql).toContain('create policy "pol_loyalty_accounts_tenant_id"');
    expect(sql).toContain('create policy "pol_ledger_entries_tenant_id"');
  });
});
