/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateMessagesMigration`: one transactional step that creates the `outbox` schema, the `ltree`
 *          extension and `outbox.messages` with its public-id key, the kind check, every column commented, the nullable
 *          scope columns, no row-level-security policy, and the partial index the relay's scan reads.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0078 (decision 4).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateMessagesMigration } from "#node/database/migrations/0001-create-messages.migration";

describe("CreateMessagesMigration", () => {
  const { after, steps } = compileMigration(CreateMessagesMigration, {
    schema: "outbox",
    createsSchema: true,
  });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the schema, the ltree extension and the message table with its kind check", () => {
    expect(statements[0]).toBe('create schema if not exists "outbox"');
    expect(sql).toContain('create extension if not exists "ltree"');
    expect(sql).toContain('create table "outbox"."messages" (');
    expect(sql).toContain('"attempts" integer default 0 not null');
    expect(sql).toContain(`constraint "ck_messages_kind" check ("kind" in ('event', 'change'))`);
    expect(sql).toContain('"scope_path" ltree');
  });

  it("comments every column", () => {
    for (const column of [
      "kind",
      "type",
      "data",
      "meta",
      "occurred_at",
      "scope_id",
      "scope_path",
      "attempts",
      "available_at",
      "last_error",
      "dead_at",
    ])
      expect(
        statements.some((statement) =>
          statement.startsWith(`comment on column "outbox"."messages"."${column}"`),
        ),
      ).toBe(true);
  });

  it("indexes the relay's scan of live messages and sets no row-level security", () => {
    expect(sql).toContain(
      'create index "idx_messages_available_at" on "outbox"."messages" ("available_at") where dead_at is null',
    );
    expect(sql).not.toContain("row level security");
  });
});
