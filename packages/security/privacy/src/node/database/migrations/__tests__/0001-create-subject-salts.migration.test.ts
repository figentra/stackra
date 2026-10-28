/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSubjectSaltsMigration`: it compiles to one transactional step that creates
 *          `privacy.subject_salts` keyed by scope and subject, then forces row-level security with a policy on the
 *          session's tenant setting that falls back to `-`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159; ADR 0239; gap gov2 (stackra-263).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSubjectSaltsMigration } from "#node/database/migrations/0001-create-subject-salts.migration";

describe("CreateSubjectSaltsMigration", () => {
  const { after, steps } = compileMigration(CreateSubjectSaltsMigration, {
    schema: "privacy",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the table keyed by scope and subject", () => {
    expect(sql).toContain('create table "privacy"."subject_salts"');
    expect(sql).toContain('"scope_id" varchar(63) not null');
    expect(sql).toContain('"subject" varchar(63) not null');
    expect(sql).toContain('"salt" varchar(64) not null');
    expect(sql).toContain('primary key ("scope_id", "subject")');
  });

  it("forces the policy on the session's tenant, or - outside one", () => {
    expect(sql).toContain('alter table "privacy"."subject_salts" force row level security');
    expect(sql).toContain(
      `"scope_id" = coalesce(nullif(current_setting('app.tenant_id', true), ''), '-')`,
    );
  });
});
