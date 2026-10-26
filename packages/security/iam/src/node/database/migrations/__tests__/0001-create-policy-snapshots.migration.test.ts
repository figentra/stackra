/**
 * Stackra file contract:
 * Purpose: unit tests of `CreatePolicySnapshotsMigration`: it compiles to one transactional step that creates
 *          `iam.policy_snapshots` keyed by tenant and principal, with the version and the jsonb snapshot, under the
 *          forced equality policy on `app.tenant_id`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; ADR 0407; STA-815.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreatePolicySnapshotsMigration } from "#node/database/migrations/0001-create-policy-snapshots.migration";

describe("CreatePolicySnapshotsMigration", () => {
  const { after, steps } = compileMigration(CreatePolicySnapshotsMigration, {
    schema: "iam",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the table keyed by tenant and principal", () => {
    expect(sql).toContain('create table "iam"."policy_snapshots"');
    expect(sql).toContain('"tenant_id" varchar(63) not null');
    expect(sql).toContain('"principal" varchar(63) not null');
    expect(sql).toContain('"version" integer not null');
    expect(sql).toContain('"snapshot" jsonb not null');
    expect(sql).toContain('primary key ("tenant_id", "principal")');
  });

  it("forces the tenant equality policy", () => {
    expect(sql).toContain('alter table "iam"."policy_snapshots" force row level security');
    expect(sql).toContain(`current_setting('app.tenant_id', true)`);
  });
});
