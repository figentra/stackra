/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateInboxMigration`: one transactional step that creates `outbox.inbox` keyed by the event
 *          id, both columns commented and not null, with the index the retention purge reads and no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0078 (decision 4).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateInboxMigration } from "#node/database/migrations/0002-create-inbox.migration";

describe("CreateInboxMigration", () => {
  const { after, steps } = compileMigration(CreateInboxMigration, { schema: "outbox" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the inbox keyed by event id, both columns commented", () => {
    expect(sql).toContain('create table "outbox"."inbox" (');
    expect(sql).toContain('"event_id" varchar(64) not null');
    expect(sql).toContain('primary key ("event_id")');
    for (const column of ["event_id", "received_at"])
      expect(
        statements.some((statement) =>
          statement.startsWith(`comment on column "outbox"."inbox"."${column}"`),
        ),
      ).toBe(true);
  });

  it("indexes the purge and sets no row-level security", () => {
    expect(sql).toContain(
      'create index "idx_inbox_received_at" on "outbox"."inbox" ("received_at")',
    );
    expect(sql).not.toContain("row level security");
  });
});
