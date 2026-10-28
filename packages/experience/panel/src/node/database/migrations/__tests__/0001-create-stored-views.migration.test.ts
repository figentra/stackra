/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateStoredViewsMigration`: one transactional step creating `panel.stored_views` with every
 *          column stated and commented, the version column, the lookup indexes and the forced tenant policy.
 * Boundary: test only; compiles the migration to SQL, no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; ADR 0239; ADR 0271 (decision 8).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { CreateStoredViewsMigration } from "#node/database/migrations/0001-create-stored-views.migration";

describe("CreateStoredViewsMigration", () => {
  const { steps } = compileMigration(CreateStoredViewsMigration, {
    schema: "panel",
    createsSchema: true,
    macros: [BelongsToTenantMacro],
  });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table with every column stated and commented", () => {
    expect(sql).toContain('create table "panel"."stored_views"');
    expect(sql).toContain('"tenant_id" varchar(33) not null');
    expect(sql).toContain('"version" integer default 1 not null');
    expect(sql).toContain('"resource" varchar(200) not null');
    expect(sql).toContain('"owner" varchar(64) not null');
    expect(sql).toContain('"sharing" text not null');
    expect(sql).toContain('"role" varchar(200) null');
    expect(sql).toContain('"layout" text not null');
    expect(sql).toContain('"layout_by" varchar(200) null');
    expect(sql).toContain('"filter" jsonb not null');
    expect(sql).toContain('"sort" jsonb null');
    expect(sql).toContain('"totals" jsonb not null');
    expect(sql).toContain(
      'comment on column "panel"."stored_views"."owner" is \'The owner\'\'s principal id.\'',
    );
  });

  it("indexes the lookups and forces the tenant policy", () => {
    expect(sql).toContain('"idx_stored_views_tenant_id_resource_owner"');
    expect(sql).toContain('"idx_stored_views_tenant_id_resource_sharing"');
    expect(sql).toContain('alter table "panel"."stored_views" force row level security');
    expect(sql).toContain('create policy "pol_stored_views_tenant_id"');
  });
});
