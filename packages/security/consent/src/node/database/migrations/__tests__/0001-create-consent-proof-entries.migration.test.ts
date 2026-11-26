/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateConsentProofEntriesMigration`: it compiles to one transactional step that creates
 *          `consent.consent_proof_entries` with the `cpf` key, the tenant column under its forced equality policy, the
 *          proof and hash-chain columns with their nullability and comments, the unique (tenant, subject, sequence)
 *          index, UPDATE revoked from the service's sessions, and the trigger that refuses an UPDATE from any role,
 *          each raw statement with its inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0212 (decision 3); ADR 0239; ADR 0231; STA-2818.
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { CreateConsentProofEntriesMigration } from "#node/database/migrations/0001-create-consent-proof-entries.migration";

describe("CreateConsentProofEntriesMigration", () => {
  const { after, steps } = compileMigration(CreateConsentProofEntriesMigration, {
    schema: "consent",
    createsSchema: true,
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse)).join("\n");

  it("is one transactional step that names no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with every column stated and commented", () => {
    expect(sql).toContain('create table "consent"."consent_proof_entries"');
    for (const column of [
      '"id" varchar(33) not null',
      '"tenant_id" varchar(33) not null',
      '"subject" varchar(64) not null',
      '"given_by" varchar(64) not null',
      '"relationship" varchar(64) null',
      '"document" varchar(100) not null',
      '"version" varchar(64) not null',
      '"content_hash" varchar(128) null',
      '"granted" boolean not null',
      '"at" timestamptz not null',
      '"channel" varchar(64) null',
      '"verification_method" varchar(32) null',
      '"verification_reference" varchar(200) null',
      '"sequence" integer not null',
      '"previous_hash" varchar(64) not null',
      '"hash" varchar(64) not null',
    ])
      expect(sql).toContain(column);
    expect(sql).toContain(
      'comment on column "consent"."consent_proof_entries"."hash" is \'SHA-256 of the previous hash',
    );
  });

  it("keeps each subject's chain linear under the forced tenant policy", () => {
    expect(sql).toContain(
      'create unique index "idx_consent_proof_entries_tenant_id_subject_sequence" on "consent"."consent_proof_entries"',
    );
    expect(sql).toContain('"idx_consent_proof_entries_tenant_id_subject_document"');
    expect(sql).toContain('alter table "consent"."consent_proof_entries" force row level security');
    expect(sql).toContain('create policy "pol_consent_proof_entries_tenant_id"');
  });

  it("revokes UPDATE and refuses one from any role with a trigger, each with its inverse", () => {
    expect(sql).toContain(
      'revoke update on "consent"."consent_proof_entries" from public, current_user',
    );
    expect(sql).toContain('create function "consent"."refuse_update"() returns trigger');
    expect(sql).toContain("raise exception 'consent.consent_proof_entries is append-only'");
    expect(sql).toContain(
      'create trigger "trg_consent_proof_entries_refuse_update" before update on "consent"."consent_proof_entries"',
    );
    expect(inverse).toContain('grant update on "consent"."consent_proof_entries" to current_user');
    expect(inverse).toContain('drop function if exists "consent"."refuse_update"()');
    expect(inverse).toContain(
      'drop trigger if exists "trg_consent_proof_entries_refuse_update" on "consent"."consent_proof_entries"',
    );
  });
});
