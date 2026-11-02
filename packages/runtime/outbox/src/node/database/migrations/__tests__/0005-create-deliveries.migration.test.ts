/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateDeliveriesMigration`: one transactional step that creates `outbox.deliveries` keyed by
 *          a `dlv_` public id, every column commented, with the unique key of event, subscriber and wire name, the
 *          index of live due deliveries, the per-subscriber index and no policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0511 (decisions 12 and 13).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateDeliveriesMigration } from "#node/database/migrations/0005-create-deliveries.migration";

describe("CreateDeliveriesMigration", () => {
  const { after, steps } = compileMigration(CreateDeliveriesMigration, { schema: "outbox" });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the delivery table with its columns, each commented", () => {
    expect(sql).toContain('create table "outbox"."deliveries" (');
    expect(sql).toContain('"attempts" integer default 0 not null');
    for (const column of [
      "id",
      "event_id",
      "subscriber",
      "type",
      "envelope",
      "attempts",
      "available_at",
      "last_error",
      "dead_at",
      "created_at",
    ])
      expect(
        statements.some((statement) =>
          statement.startsWith(`comment on column "outbox"."deliveries"."${column}"`),
        ),
      ).toBe(true);
  });

  // @covers sta-1910:FR-003
  it("keeps one delivery per event, subscriber and wire name", () => {
    expect(sql).toContain(
      'create unique index "idx_deliveries_event_id_subscriber_type" on "outbox"."deliveries" ("event_id", "subscriber", "type")',
    );
  });

  it("indexes the live scan and the subscriber listing, and sets no row-level security", () => {
    expect(sql).toContain(
      'create index "idx_deliveries_available_at" on "outbox"."deliveries" ("available_at") where dead_at is null',
    );
    expect(sql).toContain(
      'create index "idx_deliveries_subscriber_available_at" on "outbox"."deliveries" ("subscriber", "available_at")',
    );
    expect(sql).not.toContain("row level security");
  });
});
