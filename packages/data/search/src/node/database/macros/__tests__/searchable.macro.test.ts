/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchableMacro`: installed as `t.searchable`, it writes a nullable, commented
 *          `search_vector` (or one per locale), `search_text` and `search_filters` on a new table and as expand steps on
 *          an existing one, writes no index, and refuses no text field, a bad path and bad locales.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 as amended by ADR 0305; ADR 0221.
 */
import { compileMigration, Macro, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { SearchableMacro } from "#node/database/macros/searchable.macro";
import type { SearchableColumns } from "#node/types/searchable-columns.type";

/** The SQL of a migration that creates (or changes) `table` with `t.searchable(columns)`. */
function compiled(columns: SearchableColumns, creating: boolean): string[] {
  class SearchColumnsMigration extends Migration {
    up(schema: SchemaBuilder): void {
      const define = (t: Blueprint) => {
        if (creating) t.hasPublicId("acl");
        t.searchable(columns);
      };
      if (creating) schema.create("entries", define);
      else schema.table("entries", define);
    }
  }
  return compileMigration(SearchColumnsMigration, {
    schema: "audit",
    macros: [SearchableMacro],
  }).steps.flatMap((step) => step.sql);
}

describe(SearchableMacro, () => {
  it("is a macro", () => {
    expect(new SearchableMacro()).toBeInstanceOf(Macro);
  });

  it("writes the three nullable columns on a new table, commented with the fields, and no index", () => {
    const sql = compiled({ text: ["target"], filters: ["classification"] }, true).join("\n");
    expect(sql).toContain('"search_vector" tsvector null');
    expect(sql).toContain('"search_text" text null');
    expect(sql).toContain('"search_filters" jsonb null');
    expect(sql).toContain(
      `comment on column "audit"."entries"."search_vector" is 'Weighted full-text words of target; written by @stackra/search.'`,
    );
    expect(sql).toContain("(classification)");
    expect(sql).not.toContain("create index");
  });

  it("writes one vector per locale as expand steps on an existing table", () => {
    const sql = compiled(
      {
        text: ["title", "variants.sku"],
        filters: ["status", "collections.slug"],
        locales: ["en", "ar-SA"],
      },
      false,
    );
    expect(sql).toContain(
      'alter table "audit"."entries" add column "search_vector_en" tsvector null',
    );
    expect(sql).toContain(
      'alter table "audit"."entries" add column "search_vector_ar_sa" tsvector null',
    );
    expect(sql).toContain('alter table "audit"."entries" add column "search_text" text null');
    expect(sql.join("\n")).not.toContain('"search_vector" ');
  });

  it("refuses no text field, a bad path and bad locales", () => {
    expect(() => compiled({ text: [] }, true)).toThrow(TypeError);
    expect(() => compiled({ text: ["Title"] }, true)).toThrow(TypeError);
    expect(() => compiled({ text: ["title"], filters: ["a..b"] }, true)).toThrow(TypeError);
    expect(() => compiled({ text: ["title"], locales: [] }, true)).toThrow(TypeError);
    expect(() => compiled({ text: ["title"], locales: ["ar-SA", "ar-sa"] }, true)).toThrow(
      TypeError,
    );
    expect(() => compiled({ text: ["title"], locales: ["english!"] }, true)).toThrow(TypeError);
  });
});
