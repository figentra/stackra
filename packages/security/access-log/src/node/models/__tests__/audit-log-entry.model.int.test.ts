/**
 * Stackra file contract:
 * Purpose: integration test of `AuditLogEntry` through the ORM on Postgres: `outcome` is a `@Field(z.enum([...]))`
 *          hatch on a `t.enum()` column (`text` with a check constraint), and gen types it from that column, so a write
 *          stores the bare `ok` (never the JSON-encoded `"ok"`, which the check constraint refuses) and a read gives
 *          `ok` back.
 * Boundary: test only; integration tier (Docker through `usePostgres`, or the Testbed's `--postgres`). It runs the
 *           package's own migrations 0001 and 0002 and its committed entity list.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0159 (the migration owns the column type).
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { DataClassificationMacro } from "#node/database/macros/data-classification.macro";
import { CreateAccessLogEntriesMigration } from "#node/database/migrations/0001-create-access-log-entries.migration";
import { CreateAuditLogEntriesMigration } from "#node/database/migrations/0002-create-audit-log-entries.migration";
import { ACCESS_LOG_ENTITIES } from "#node/entities.gen";
import { AuditLogEntry } from "#node/models/audit-log-entry.model";

const postgres = usePostgres({
  entities: [...ACCESS_LOG_ENTITIES],
  migrations: [
    compileMigration(CreateAccessLogEntriesMigration, {
      schema: "access_log",
      createsSchema: true,
      macros: [BelongsToTenantMacro, DataClassificationMacro],
    }),
    compileMigration(CreateAuditLogEntriesMigration, {
      schema: "access_log",
      createsSchema: false,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

describe("AuditLogEntry on Postgres", () => {
  it("writes the outcome enum as its bare string and reads it back", async () => {
    const { database } = postgres;
    await database.transaction(async () => {
      const em = database.em();
      em.persist(
        em.create(AuditLogEntry, {
          id: "aud_01ja0000000000000000000001",
          tenantId: "ten_01ja0000000000000000000001",
          callId: "call-1",
          key: "orders.order.cancel@1",
          permission: null,
          risk: null,
          scopeId: null,
          scopePath: null,
          originKind: null,
          originId: null,
          outcome: "ok",
          code: null,
          effects: [],
          actor: { kind: "user", id: "usr_01ja0000000000000000000001" },
          fields: {},
          at: new Date("2026-11-01T10:00:00Z"),
          sequence: 1,
          previousHash: "0".repeat(64),
          hash: "1".repeat(64),
        } as never),
      );
      await em.flush();
    });

    const stored = await database
      .em()
      .getConnection()
      .execute<{ outcome: string }[]>(
        "select outcome from access_log.audit_log_entries where id = ?",
        ["aud_01ja0000000000000000000001"],
      );
    expect(stored[0]?.outcome).toBe("ok");

    const read = await database
      .em()
      .fork()
      .findOneOrFail(AuditLogEntry, { id: "aud_01ja0000000000000000000001" } as never);
    expect(read.outcome).toBe("ok");
  });
});
