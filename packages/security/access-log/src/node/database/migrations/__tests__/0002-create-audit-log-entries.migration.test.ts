/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAuditLogEntriesMigration`: it compiles to one transactional step that creates
 *          `access_log.audit_log_entries` with the `aud` key, the tenant column under its forced equality policy, the
 *          nullable call fields, the hash-chain columns with their unique (tenant, sequence) index, and the trigger that
 *          refuses an UPDATE with its inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0212 (decision 3); ADR 0239; ADR 0231.
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { DataClassificationMacro } from "#node/database/macros/data-classification.macro";
import { CreateAuditLogEntriesMigration } from "#node/database/migrations/0002-create-audit-log-entries.migration";

describe("CreateAuditLogEntriesMigration", () => {
  const { steps } = compileMigration(CreateAuditLogEntriesMigration, {
    schema: "access_log",
    createsSchema: false,
    macros: [BelongsToTenantMacro, DataClassificationMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse)).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with every column stated and commented", () => {
    expect(sql).toContain('create table "access_log"."audit_log_entries"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"tenant_id" varchar(33) not null');
    expect(sql).toContain('"call_id" varchar(64) not null');
    expect(sql).toContain('"key" varchar(200) not null');
    expect(sql).toContain('"permission" varchar(200) null');
    expect(sql).toContain('"effects" jsonb not null');
    expect(sql).toContain('"actor" jsonb not null');
    expect(sql).toContain('"scope_path" text null');
    expect(sql).toContain('"outcome" text not null');
    expect(sql).toContain('"code" varchar(100) null');
    expect(sql).toContain('"fields" jsonb not null');
    expect(sql).toContain('"sequence" integer not null');
    expect(sql).toContain('"hash" varchar(64) not null');
    expect(sql).toContain(
      'comment on column "access_log"."audit_log_entries"."hash" is \'SHA-256 of the previous hash',
    );
  });

  it("keeps each tenant's chain linear under the forced equality policy", () => {
    expect(sql).toContain(
      'create unique index "idx_audit_log_entries_tenant_id_sequence" on "access_log"."audit_log_entries"',
    );
    expect(sql).toContain('"idx_audit_log_entries_tenant_id_call_id"');
    expect(sql).toContain('"idx_audit_log_entries_tenant_id_key"');
    expect(sql).toContain('"idx_audit_log_entries_at"');
    expect(sql).toContain('alter table "access_log"."audit_log_entries" force row level security');
    expect(sql).toContain('create policy "pol_audit_log_entries_tenant_id"');
  });

  it("refuses an UPDATE through the package's trigger function, with the trigger's inverse", () => {
    expect(sql).toContain(
      'create trigger "trg_audit_log_entries_refuse_update" before update on "access_log"."audit_log_entries"',
    );
    expect(sql).toContain('execute function "access_log"."refuse_update"()');
    expect(inverse).toContain(
      'drop trigger if exists "trg_audit_log_entries_refuse_update" on "access_log"."audit_log_entries"',
    );
  });
});
