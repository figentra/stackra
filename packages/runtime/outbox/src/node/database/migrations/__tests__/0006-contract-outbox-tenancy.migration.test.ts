/**
 * Stackra file contract:
 * Purpose: unit tests of `ContractOutboxTenancyMigration`: one transactional step (the online owner indexes after it)
 *          that adds `tenant_id` to every owned table filled from `app.tenant_id`, backfills a row at a tenant node
 *          (nlevel 3) from its scope, refuses a row deeper than a tenant node with each remedy before any policy, then
 *          gives each table the platform form and its system access in one blueprint, copies the log's policies onto
 *          its dated partitions, and writes the system functions, each owned by the system-access role.
 * Boundary: test only; pure compilation through @stackra/database, no database. The SQL runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ContractOutboxTenancyMigration } from "#node/database/migrations/0006-contract-outbox-tenancy.migration";

/** Every table this migration makes tenant-owned. */
const TABLES = [
  "messages",
  "deliveries",
  "changes",
  "changes_default",
  "replica_changes",
  "device_sequences",
  "offline_cap_uses",
];

/** The session's owner setting, as the policies compare it. */
const OWNER_SETTING = "nullif(current_setting('app.tenant_id', true), '')::varchar(33)";

describe("ContractOutboxTenancyMigration", () => {
  const { steps } = compileMigration(ContractOutboxTenancyMigration, { schema: "outbox" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");
  const at = (text: string) => statements.findIndex((statement) => statement.includes(text));

  it("runs everything but the online owner indexes in one transaction", () => {
    expect(step?.transactional).toBe(true);
    for (const online of steps.slice(1)) {
      expect(online.transactional).toBe(false);
      expect(online.sql.join("\n")).toMatch(/create index concurrently .*"tenant_id"/);
    }
    expect(steps.slice(1).some((online) => online.sql.join("\n").includes('"changes"'))).toBe(
      false,
    );
  });

  it("adds a nullable owner column filled from the call's tenant, never from input", () => {
    for (const table of TABLES.filter((name) => name !== "changes_default"))
      expect(sql).toMatch(
        new RegExp(
          `alter table "outbox"\\."${table}" add column "tenant_id" varchar\\(33\\) default nullif\\(current_setting\\('app\\.tenant_id', true\\), ''\\)`,
        ),
      );
    expect(sql).not.toMatch(/"tenant_id".* not null/);
  });

  it("backfills a row at a tenant node from its scope, then refuses a deeper one with its remedy", () => {
    for (const table of ["messages", "changes", "replica_changes", "device_sequences"])
      expect(statements).toContain(
        `update "outbox"."${table}" set "tenant_id" = "scope_id" where "tenant_id" is null and nlevel("scope_path") = 3`,
      );
    expect(sql).toContain(
      `update "outbox"."deliveries" set "tenant_id" = "envelope" #>> '{scope,id}' where "tenant_id" is null and nlevel(("envelope" #>> '{scope,path}')::ltree) = 3`,
    );
    const refusals = statements.filter((statement) =>
      statement.startsWith("do $$\ndeclare\n  found"),
    );
    expect(refusals).toHaveLength(5);
    expect(refusals.join("\n")).toContain(
      'where "tenant_id" is null and (nlevel("scope_path") > 3)',
    );
    expect(refusals.join("\n")).toContain("Drain the relay first");
    expect(refusals.join("\n")).toContain("Let every change consumer pass those changes");
    const firstPolicy = at("create policy");
    for (const refusal of refusals) expect(statements.indexOf(refusal)).toBeLessThan(firstPolicy);
  });

  it("gives every owned table and the default partition the platform form", () => {
    for (const table of TABLES) {
      const qualified = `"outbox"."${table}"`;
      const own = `"tenant_id" is not distinct from ${OWNER_SETTING}`;
      expect(sql).toContain(`alter table ${qualified} force row level security`);
      expect(statements).toContain(
        `create policy "pol_${table}_tenant_id" on ${qualified} using ("tenant_id" = ${OWNER_SETTING} or "tenant_id" is null) with check (${own})`,
      );
      expect(statements).toContain(
        `create policy "pol_${table}_tenant_id_write_delete" on ${qualified} as restrictive for delete using (${own})`,
      );
    }
    // only the deliveries' lease updates as the system role, so only its write policy lets that role through
    expect(sql).toContain(
      `create policy "pol_deliveries_tenant_id_write_update" on "outbox"."deliveries" as restrictive for update using (("tenant_id" is not distinct from ${OWNER_SETTING}) or current_user = 'stackra_system_access')`,
    );
    expect(sql.match(/or current_user = 'stackra_system_access'/g)).toHaveLength(1);
  });

  it("declares the system access of each claimed table, select-only but for the deliveries' lease", () => {
    for (const declaration of [
      "-- stackra:system-access outbox.messages select=id,tenant_id,occurred_at,available_at,dead_at ",
      "-- stackra:system-access outbox.deliveries select=id,tenant_id,subscriber,attempts,available_at,dead_at,created_at update=available_at ",
      "-- stackra:system-access outbox.changes select=tx,seq,type,occurred_at,tenant_id ",
      "-- stackra:system-access outbox.changes_default select=tx,seq,occurred_at,tenant_id ",
      "-- stackra:system-access outbox.replica_changes select=partition,position,tenant_id ",
    ])
      expect(statements.some((statement) => statement.startsWith(declaration))).toBe(true);
    expect(sql).not.toContain("outbox.device_sequences select=");
    expect(sql).not.toContain("outbox.offline_cap_uses select=");
  });

  it("copies the log's owner policies onto every dated partition", () => {
    const secure = at("create function outbox.secure_change_partition(partition_name text)");
    expect(secure).toBeGreaterThan(at('create policy "pol_changes_tenant_id"'));
    expect(statements[secure]).toContain("force row level security");
    expect(statements[secure]).toContain("p.polname like 'pol\\_changes\\_tenant\\_id%'");
    expect(statements[secure + 1]).toContain(
      "perform outbox.secure_change_partition(child.relname)",
    );
    expect(statements[secure + 1]).toContain("c.relname <> 'changes_default'");
  });

  it("writes each system function owned by the system-access role, returning ids, owners and order only", () => {
    for (const name of [
      "replica_bounds",
      "claim_due_messages",
      "claim_dead_messages",
      "lease_due_deliveries",
      "list_deliveries",
      "claim_changes",
      "change_position_at",
      "claim_expired_changes",
    ]) {
      expect(
        statements.some((statement) =>
          statement.startsWith(`-- stackra:system-function outbox.${name} `),
        ),
      ).toBe(true);
      expect(sql).toMatch(
        new RegExp(`alter function "outbox"\\."${name}"\\(.*\\) owner to "stackra_system_access"`),
      );
    }
    expect(sql).not.toMatch(/returns table \([^)]*"(data|envelope|meta|row)"/);
  });
});
