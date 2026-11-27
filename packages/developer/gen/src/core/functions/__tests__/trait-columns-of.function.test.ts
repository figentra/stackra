/**
 * Stackra file contract:
 * Purpose: unit tests of `traitColumnsOf` and `TRAIT_COLUMNS`: a trait's columns and indexes by its registry code
 *          (`HasTree` is `has_tree`, a namespaced name by its last segment), a marker trait and an unknown one add
 *          nothing, a trait named twice counts once, a later trait's column of the same name wins, and `Partitioned`
 *          gives the optional BRIN index over its `by` column only when `by` was read.
 * Boundary: test only; pure trait records in, columns out.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0096 (decision 4); STA-1408.
 */
import { describe, expect, it } from "@stackra/testing";

import { TRAIT_COLUMNS } from "#core/constants/trait-columns.constant";
import { traitColumnsOf } from "#core/functions/trait-columns-of.function";

/** A trait as discovery records it. */
const use = (name: string, ...args: unknown[]) => ({ name, args });

describe("traitColumnsOf", () => {
  it("gives a trait's columns and indexes by its registry code", () => {
    expect(traitColumnsOf([use("HasPublicId", "cat"), use("Timestamps"), use("HasTree")])).toEqual({
      columns: [
        { name: "id", type: "varchar(33)", nullable: false },
        { name: "created_at", type: "timestamptz", nullable: false },
        { name: "updated_at", type: "timestamptz", nullable: false },
        { name: "parent_id", type: "varchar(33)", nullable: true },
        { name: "tree_path", type: "ltree", nullable: "either" },
      ],
      indexes: [{ columns: ["tree_path"], method: "gist" }],
    });
  });

  it("reads a namespaced trait by its last segment", () => {
    expect(traitColumnsOf([use("database.HasMetadata")])).toEqual({
      columns: [{ name: "metadata", type: "jsonb", nullable: false }],
      indexes: [{ columns: ["metadata"], method: "gin", optional: true }],
    });
  });

  it("adds nothing for a marker trait or one it does not know, and counts a trait once", () => {
    expect(traitColumnsOf([use("AppendOnly"), use("HasRevisions"), use("MadeUp")])).toEqual({
      columns: [],
      indexes: [],
    });
    expect(traitColumnsOf([use("SoftDeletes"), use("SoftDeletes")]).columns).toEqual([
      { name: "deleted_at", type: "timestamptz", nullable: true },
    ]);
  });

  it("lets a later trait's column of the same name win, in the later trait's place", () => {
    expect(
      traitColumnsOf([use("BelongsToTenant"), use("Versioned"), use("BelongsToTenantOrPlatform")])
        .columns,
    ).toEqual([
      { name: "version", type: "integer", nullable: false },
      { name: "tenant_id", type: "varchar(33)", nullable: true },
    ]);
  });

  it("gives Partitioned an optional BRIN index over its by column, and none when by was not read", () => {
    expect(traitColumnsOf([use("Partitioned", { by: "occurredAt", interval: "month" })])).toEqual({
      columns: [],
      indexes: [{ columns: ["occurred_at"], method: "brin", optional: true }],
    });
    expect(traitColumnsOf([use("Partitioned", null)]).indexes).toEqual([]);
    expect(traitColumnsOf([use("Partitioned", { by: 3 })]).indexes).toEqual([]);
  });
});

describe("TRAIT_COLUMNS", () => {
  it("is keyed by snake_case registry codes and writes snake_case columns", () => {
    for (const [code, row] of Object.entries(TRAIT_COLUMNS)) {
      expect(code).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      for (const column of row.columns)
        expect(column.name).toMatch(/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/);
      for (const index of row.indexes)
        for (const column of index.columns)
          expect(row.columns.map((each) => each.name)).toContain(column);
    }
    expect(Object.isFrozen(TRAIT_COLUMNS)).toBe(true);
  });
});
