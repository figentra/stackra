/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateDeliveriesMigration`: one transactional step that creates `outbox.deliveries` with its
 *          public-id key, every column commented, the unique (event id, subscriber, type) the fan-out's
 *          insert-or-ignore targets, the partial index the cross-app relay's scan reads, and no row-level security.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0511 (decision 12).
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

  it("creates the delivery table with its attempts default and nullable failure columns", () => {
    expect(sql).toContain('create table "outbox"."deliveries" (');
    expect(sql).toContain('"attempts" integer default 0 not null');
    expect(sql).toContain('"envelope" jsonb not null');
    expect(sql).toContain('"dead_at" timestamptz');
  });

  it("comments every column", () => {
    for (const column of [
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

  it("keys a delivery by event, subscriber and type, indexes the relay's scan and sets no row-level security", () => {
    expect(sql).toContain(
      'create unique index "idx_deliveries_event_id_subscriber_type" on "outbox"."deliveries" ("event_id", "subscriber", "type")',
    );
    expect(sql).toContain(
      'create index "idx_deliveries_available_at" on "outbox"."deliveries" ("available_at") where dead_at is null',
    );
    expect(sql).not.toContain("row level security");
  });
});
