/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateFiresMigration`: the `scheduler.fires` table keyed by (fire key, fire time), its owner
 *          column filled from `app.tenant_id`, in the platform form with no system access.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decision 5); ADR 0239 (2026-11-07 amendment, gap C).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateFiresMigration } from "#node/database/migrations/0003-create-fires.migration";

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("CreateFiresMigration", () => {
  const { steps } = compileMigration(CreateFiresMigration, { schema: "scheduler" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("creates the fire table keyed by fire key and fire time, its owner from the call", () => {
    expect(sql).toContain('create table "scheduler"."fires" (');
    expect(sql).toMatch(/primary key \("fire_key", "fire_at"\)/);
    expect(sql).toContain(
      `"tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')`,
    );
  });

  it("is in the platform form, with no system access", () => {
    expect(sql).toContain('alter table "scheduler"."fires" force row level security');
    expect(sql).toContain(
      `create policy "pol_fires_tenant_id" on "scheduler"."fires" using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null)`,
    );
    expect(sql).not.toContain("stackra:system-access");
  });
});
