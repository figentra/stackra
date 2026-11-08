/**
 * Stackra file contract:
 * Purpose: tests of `ContractWebhooksTenancyMigration`: one transaction that adds a nullable `tenant_id` filled from
 *          `app.tenant_id` to `webhook_endpoints` and `webhook_deliveries`, backfills it (an endpoint at a top-level
 *          tenant node from its `scope_id`, a delivery from its endpoint), refuses while a row still has none, then sets
 *          NOT NULL, enables and forces row-level security and writes `pol_<table>_tenant_id` as the one policy; the two
 *          indexes follow online.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239 (decision 1; 2026-11-07 amendment, group (c)); ADR 0347 (decisions 1 and 2).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { ContractWebhooksTenancyMigration } from "#node/database/migrations/0003-contract-webhooks-tenancy.migration";

const TABLES = ["webhook_endpoints", "webhook_deliveries"];

describe("ContractWebhooksTenancyMigration", () => {
  const { steps } = compileMigration(ContractWebhooksTenancyMigration, {
    schema: "webhooks",
    macros: [BelongsToTenantMacro],
  });
  const [first, ...online] = steps;
  const sql = first?.sql ?? [];
  const at = (match: (statement: string) => boolean) => sql.findIndex(match);

  it("is one transaction, then the two tenant indexes built online", () => {
    expect(first?.transactional).toBe(true);
    expect(online.map((step) => step.transactional)).toEqual([false, false]);
    for (const table of TABLES)
      expect(online.flatMap((step) => step.sql)).toContainEqual(
        expect.stringContaining(`create index concurrently "idx_${table}_tenant_id"`),
      );
  });

  it("adds the column, backfills it, refuses on a null, then contracts, in that order", () => {
    const added = at(
      (s) => s.includes('add column "tenant_id"') && s.includes("webhook_deliveries"),
    );
    const endpoints = at((s) => s.startsWith('update "webhooks"."webhook_endpoints"'));
    const deliveries = at((s) => s.startsWith('update "webhooks"."webhook_deliveries"'));
    const refused = at((s) => s.startsWith("do $$"));
    const contracted = at((s) => s.includes('alter column "tenant_id" set not null'));
    expect([added, endpoints, deliveries, refused, contracted].every((i) => i >= 0)).toBe(true);
    expect(added < endpoints && endpoints < deliveries).toBe(true);
    expect(deliveries < refused && refused < contracted).toBe(true);
    expect(sql[endpoints]).toContain('set "tenant_id" = "scope_id"');
    expect(sql[endpoints]).toContain('nlevel("scope_path") = 3');
    expect(sql[deliveries]).toContain('set "tenant_id" = e."tenant_id"');
    for (const table of TABLES)
      expect(sql[refused]).toContain(`from "webhooks"."${table}" where "tenant_id" is null;`);
  });

  it("fills the column from app.tenant_id and makes the tenant equality the one forced policy", () => {
    for (const table of TABLES) {
      const qualified = `"webhooks"."${table}"`;
      expect(sql).toContainEqual(
        expect.stringContaining(
          `alter table ${qualified} add column "tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) null`,
        ),
      );
      expect(sql).toContain(`alter table ${qualified} alter column "tenant_id" set not null`);
      expect(sql).toContain(`alter table ${qualified} enable row level security`);
      expect(sql).toContain(`alter table ${qualified} force row level security`);
      expect(sql).toContain(
        `create policy "pol_${table}_tenant_id" on ${qualified} using ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33)) with check ("tenant_id" = nullif(current_setting('app.tenant_id', true), '')::varchar(33))`,
      );
      expect(
        sql.filter(
          (statement) => statement.startsWith("create policy ") && statement.includes(qualified),
        ),
      ).toHaveLength(1);
    }
    expect(sql.some((statement) => statement.startsWith("drop policy "))).toBe(false);
  });
});
