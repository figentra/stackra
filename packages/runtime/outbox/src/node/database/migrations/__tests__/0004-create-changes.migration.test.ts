/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateChangesMigration`: the change log is range-partitioned by `occurred_at` with a default
 *          partition, ordered by an identity `seq` and the writing transaction's `xid8`, indexed for the cursor read,
 *          every column commented, and the cursor table is keyed by consumer.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateChangesMigration } from "#node/database/migrations/0004-create-changes.migration";

describe("CreateChangesMigration", () => {
  const { steps } = compileMigration(CreateChangesMigration, { schema: "outbox" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("creates the partitioned change log with its default partition", () => {
    expect(sql).toContain("create table outbox.changes (");
    expect(sql).toContain("seq bigint generated always as identity");
    expect(sql).toContain("tx xid8 not null default pg_current_xact_id()");
    expect(sql).toContain("primary key (seq, occurred_at)");
    expect(sql).toContain(") partition by range (occurred_at)");
    expect(sql).toContain(
      "create table outbox.changes_default partition of outbox.changes default",
    );
  });

  it("indexes the cursor read and comments every column", () => {
    expect(sql).toContain("create index ix_changes_tx_seq on outbox.changes (tx, seq)");
    for (const column of [
      "seq",
      "tx",
      "type",
      "data",
      "meta",
      "occurred_at",
      "scope_id",
      "scope_path",
    ])
      expect(sql).toContain(`comment on column outbox.changes.${column} is`);
  });

  it("doubles the quotes in a comment, so each one is a valid literal (STA-1664)", () => {
    expect(sql).toContain(
      "comment on column outbox.changes.type is 'The changed model''s class name.'",
    );
    expect(sql).toContain(
      "comment on column outbox.change_cursors.consumer is 'The change consumer class''s name.'",
    );
    const comments = steps
      .flatMap((step) => step.sql)
      .filter((statement) => statement.startsWith("comment on column"));
    expect(comments).toHaveLength(14);
    // Inside the literal, a quote only ever comes doubled.
    for (const statement of comments)
      expect(statement.slice(statement.indexOf(" is '") + 5, -1)).not.toMatch(/(^|[^'])'([^']|$)/);
  });

  it("keys a cursor by its consumer", () => {
    expect(sql).toContain("create table outbox.change_cursors (consumer varchar(255) primary key");
    expect(sql).toContain("stalled_at timestamptz)");
  });
});
