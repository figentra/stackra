/**
 * Stackra file contract:
 * Purpose: unit tests of `readSearchableColumns`: a service's `t.searchable` calls per module with the table of the
 *          nearest `schema.create`/`schema.table` before them, in file order, filters defaulting to none; a package's
 *          under `src/node` with the member as module.
 * Boundary: test only; writes small fixtures under `.cache/`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; data-layer gap se10.
 */
import { describe, expect, it } from "@stackra/testing";

import { readSearchableColumns } from "#node/functions/read-searchable-columns.function";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("readSearchableColumns", () => {
  it("reads a service's calls per module, table and file order", () => {
    const root = writeFixtureMember("shop", {
      "src/modules/catalog/database/migrations/0001-create-products.migration.ts": [
        'schema.create("products", (t: Blueprint) => {',
        '  t.string("title");',
        '  t.searchable({ text: ["title", "variants.sku"], filters: ["status"] });',
        "});",
        'schema.create("brands", (t: Blueprint) => {',
        "  t.searchable({",
        '    text: ["name"],',
        '    locales: ["en", "ar"],',
        "  });",
        "});",
      ].join("\n"),
      "src/modules/catalog/database/migrations/0002-search-products.migration.ts": [
        'schema.table("products", (t: Blueprint) => {',
        '  t.searchable({ text: ["title"], filters: ["status", "brand.slug"], version: 2 });',
        "});",
      ].join("\n"),
    });
    expect(readSearchableColumns(root, "service", "shop")).toEqual([
      {
        file: "src/modules/catalog/database/migrations/0001-create-products.migration.ts",
        module: "catalog",
        table: "products",
        text: ["title", "variants.sku"],
        filters: ["status"],
      },
      {
        file: "src/modules/catalog/database/migrations/0001-create-products.migration.ts",
        module: "catalog",
        table: "brands",
        text: ["name"],
        filters: [],
      },
      {
        file: "src/modules/catalog/database/migrations/0002-search-products.migration.ts",
        module: "catalog",
        table: "products",
        text: ["title"],
        filters: ["status", "brand.slug"],
        version: 2,
      },
    ]);
  });

  it("reads a package's migrations with the member as module", () => {
    const root = writeFixtureMember("loyalty-kit", {
      "src/node/database/migrations/0001-create-loyalty-tables.migration.ts": [
        'schema.create("loyalty_accounts", (t: Blueprint) => {',
        '  t.searchable({ text: ["member_id"], filters: ["tier"] });',
        "});",
      ].join("\n"),
    });
    expect(readSearchableColumns(root, "package", "loyalty_kit")).toEqual([
      {
        file: "src/node/database/migrations/0001-create-loyalty-tables.migration.ts",
        module: "loyalty_kit",
        table: "loyalty_accounts",
        text: ["member_id"],
        filters: ["tier"],
      },
    ]);
  });
});
